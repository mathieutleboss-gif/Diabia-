"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { analyserCSVDetaille, nommerColonnesCSV, choisirEntete, detecterColonnes, detecterUniteColonne, type CsvMapping, type CsvRow } from "../../lib/csvParser";
import { fusionnerInjections, fusionnerMesures } from "../../lib/mesures";
import { exporterDonneesLocales, lireProfilLocal, restaurerDonneesLocales } from "../../lib/storage";
import type { GlucoseUnit } from "../../lib/glucoseUnits";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

const champs:Array<[keyof CsvMapping,string]> = [["timestamp","Horodatage complet"],["date","Date (si pas d’horodatage)"],["heure","Heure séparée"],["glycemie","Glycémie principale"],["glycemieSecondaire","Glycémie secondaire, si principale vide"],["insuline","Dose d’insuline (U)"],["insulineBasale","Autre dose / basale administrée (U)"],["typeInsuline","Type de dose, si présent"],["note","Note"]];
const headers=nommerColonnesCSV;
export default function ImportPage() {
  const lectureActive=useRef(0);
  useEffect(()=>()=>{lectureActive.current++;},[]);
  const [rows,setRows]=useState<unknown[][]>([]),[entete,setEntete]=useState(0),[mapping,setMapping]=useState<CsvMapping>({});
  const [unite,setUnite]=useState<GlucoseUnit>(()=>lireProfilLocal().uniteGlycemie||"mg/dL");
  const [lecture,setLecture]=useState(false),[nom,setNom]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [mode,setMode]=useState("fusion"),[confirmation,setConfirmation]=useState(false),[valide,setValide]=useState(false);
  const colonnes=useMemo(()=>headers(rows[entete]),[rows,entete]);
  const lignes=useMemo(()=>rows.slice(entete+1).map(row=>Object.fromEntries(colonnes.map((h,i)=>[h,row[i]??""])) as CsvRow),[rows,entete,colonnes]);
  const analyse=useMemo(()=>analyserCSVDetaille(lignes,unite,{mapping,separerInjections:true,premiereLigne:entete+2}),[lignes,mapping,unite,entete]);
  const configuration=!!(mapping.timestamp||mapping.date)&&!!(mapping.glycemie||mapping.glycemieSecondaire||mapping.insuline||mapping.insulineBasale);
  const colonnesUtilisees=Object.values(mapping).filter(Boolean);
  const ambigue=new Set(colonnesUtilisees).size!==colonnesUtilisees.length;
  const total=analyse.mesures.length+analyse.injections.length;
  function configurer(index:number,tableau=rows){setEntete(index);const m=detecterColonnes(headers(tableau[index]));setMapping(m);const u=detecterUniteColonne(m.glycemie||m.glycemieSecondaire||"");if(u)setUnite(u);setValide(false);}
  function lire(event:React.ChangeEvent<HTMLInputElement>){
    const f=event.target.files?.[0];event.target.value="";if(!f)return;const lectureId=++lectureActive.current;
    setRows([]);setMessage("");setError("");setValide(false);setNom(f.name);
    if(f.size>10*1024*1024){setError("Le fichier dépasse 10 Mo.");return;}
    setLecture(true);
    try{Papa.parse<unknown[]>(f,{header:false,worker:true,complete(result){if(lectureId!==lectureActive.current)return;setLecture(false);if(result.errors.length){setError("Le fichier contient une erreur de structure CSV. Aucun enregistrement n’a été ajouté.");return;}if(!result.data.length){setError("Le fichier est vide.");return;}const index=choisirEntete(result.data);setRows(result.data);configurer(index,result.data);},error(){if(lectureId!==lectureActive.current)return;setLecture(false);setError("Lecture impossible. Aucune donnée n’a été modifiée.");}});}catch{setLecture(false);setError("Lecture impossible dans ce navigateur.");}
  }
  function importer(){
    if(!valide||!configuration||ambigue||!total)return;
    try{
      const anciennes=exporterDonneesLocales();
      if(mode === "fusion" && anciennes.mesures.some(m => m.id?.startsWith("demo-"))) throw new Error("Ton historique contient l’exemple fictif intégré. Pour éviter de le mélanger à ton export, choisis Remplacer glycémies et injections ou utilise un espace vide. Une confirmation sera demandée.");
      const base=mode==="fusion"?anciennes.mesures:[],baseInj=mode==="fusion"?anciennes.injections:[];
      // Les anciennes doses liées à une glycémie ne doivent pas être recomptées au réimport.
      const inj=fusionnerInjections(baseInj,analyse.injections,base);
      const nouvelles=analyse.mesures.map(m=>{const legacy=base.find(a=>a.insuline!==undefined&&a.timestamp===m.timestamp&&Number(a.glycemie)===Number(m.glycemie)&&(a.note||"")===(m.note||""));return legacy?{...m,insuline:legacy.insuline}:m;});
      const fusion=fusionnerMesures(base,nouvelles);
      if(!restaurerDonneesLocales({...anciennes,mesures:fusion.mesures,injections:inj.injections}))throw new Error("Stockage indisponible ou données invalides.");
      setMessage(`${fusion.ajoutees} glycémie(s) et ${inj.ajoutees} dose(s) ajoutées. ${fusion.doublons+inj.doublons} doublon(s) ignorés.`);setRows([]);setConfirmation(false);setError("");
    }catch(e){setConfirmation(false);setError(e instanceof Error?e.message:"Import impossible. Vérifie le stockage local.");}
  }
  return <PageShell width="max-w-6xl"><PageHero eyebrow="Import guidé" title="Glycémie et insuline, ensemble." description="Lis ton export localement, choisis les colonnes et vérifie ce qui sera enregistré avant de confirmer."/>
    <GlassPanel><a href="/examples/diabia-exemple.csv" download className="mb-5 inline-flex rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">Télécharger un CSV fictif pour tester →</a><div className="rounded-2xl bg-blue-50 p-5 text-sm leading-7 text-blue-950"><strong>Ce que le fichier contient dépend de l’appareil et des données enregistrées.</strong> Une dose peut être sur une ligne distincte de la glycémie. Diabia conserve ces injections sans inventer de valeur glycémique. Les débits en U/h ne sont pas des doses en U et ne sont pas additionnés.</div>
      <label className="mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8"><span aria-hidden="true" className="text-3xl text-blue-600">↥</span><span className="font-semibold text-slate-900">{lecture?"Lecture en cours…":nom||"Choisir un export CSV"}</span><span className="text-xs text-slate-500">10 Mo maximum · le fichier reste dans ce navigateur</span><input type="file" disabled={lecture} accept=".csv,text/csv" onChange={lire} className="mt-2 max-w-full text-sm"/></label>
      {rows.length>0&&<><div className="mt-7 grid gap-5 sm:grid-cols-2"><FormField label="Ligne des titres de colonnes"><select className={fieldClassName} value={entete} onChange={e=>configurer(Number(e.target.value))}>{rows.slice(0,40).map((r,i)=><option key={i} value={i}>Ligne {i+1} · {r.slice(0,3).map(String).join(" / ").slice(0,100)}</option>)}</select></FormField><FormField label="Unité de glycémie du fichier"><select className={fieldClassName} value={unite} onChange={e=>{setUnite(e.target.value as GlucoseUnit);setValide(false);}}><option>mg/dL</option><option>g/L</option><option>mmol/L</option></select></FormField></div>
      <h2 className="mt-7 text-xl font-semibold text-slate-950">Vérifier les colonnes</h2><p className="mt-2 text-sm leading-6 text-slate-500">Une détection est proposée pour certains titres courants. Vérifie-la : la compatibilité exacte avec ton appareil doit être confirmée sur son export. Une seule colonne par champ ; choisis uniquement des doses administrées en U.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">{champs.map(([key,label])=><FormField key={key} label={label}><select className={fieldClassName} value={mapping[key]||""} onChange={e=>{setMapping({...mapping,[key]:e.target.value});setValide(false);}}><option value="">Non présente / ignorer</option>{colonnes.map(h=><option key={h}>{h}</option>)}</select></FormField>)}</div>
      {(!configuration||ambigue)&&<p role="alert" className="mt-4 text-sm text-amber-800">{ambigue?"Une colonne est utilisée plusieurs fois. Corrige les choix pour éviter de compter une dose deux fois.":"Choisis une date ou un horodatage et au moins une colonne de glycémie ou d’insuline."}</p>}
      <section className="mt-6 rounded-3xl border border-violet-100 bg-violet-50/40 p-5"><h2 className="text-lg font-semibold">Ce qui sera importé</h2><div className="mt-4 grid grid-cols-3 gap-3">{[[analyse.mesures.length,"glycémies"],[analyse.injections.length,"doses d’insuline"],[analyse.lignesRejetees,"lignes rejetées"]].map(([v,l])=><div key={l} className="rounded-2xl bg-white p-4"><strong className="text-2xl text-slate-950">{v}</strong><p className="mt-1 text-xs text-slate-500">{l}</p></div>)}</div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th className="p-2">Type</th><th className="p-2">Date / heure</th><th className="p-2">Valeur</th></tr></thead><tbody>{analyse.mesures.slice(0,3).map(m=><tr key={m.id}><td className="p-2">Glycémie</td><td>{m.date} · {m.heure}</td><td>{m.glycemie} mg/dL</td></tr>)}{analyse.injections.slice(0,3).map(i=><tr key={i.id} className="text-violet-900"><td className="p-2">Insuline{i.type==="basale"?" · basale":""}</td><td>{i.date} · {i.heure}</td><td>{i.dose} U</td></tr>)}</tbody></table></div>
      {analyse.rejets.length>0&&<details className="mt-4 text-sm text-amber-900"><summary className="cursor-pointer font-semibold">Pourquoi certaines lignes sont rejetées ?</summary><ul className="mt-2 space-y-2">{analyse.rejets.slice(0,10).map(r=><li key={r.ligne}>Ligne {r.ligne} : {r.raison}</li>)}</ul></details>}</section>
      <fieldset className="mt-5 flex flex-wrap gap-5 text-sm"><legend className="mb-3 font-semibold">Intégration à l’historique</legend><label><input type="radio" checked={mode==="fusion"} onChange={()=>setMode("fusion")} className="mr-2 accent-blue-600"/>Ajouter et éviter les doublons</label><label><input type="radio" checked={mode==="remplacement"} onChange={()=>setMode("remplacement")} className="mr-2 accent-blue-600"/>Remplacer glycémies et injections</label></fieldset>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={valide} onChange={e=>setValide(e.target.checked)} className="mt-1 size-4 accent-blue-600"/>J’ai vérifié les colonnes, les unités et les valeurs de l’aperçu.</label><button disabled={!valide||!configuration||ambigue||!total} className={`${primaryButtonClassName} mt-4`} onClick={()=>mode==="remplacement"?setConfirmation(true):importer()}>Importer {analyse.mesures.length} glycémies et {analyse.injections.length} doses</button></>}
      {confirmation&&<ConfirmDialog title="Remplacer glycémies et injections ?" description="Les mesures et doses actuelles seront remplacées. Le profil et le journal sont conservés. Exporte une sauvegarde avant de continuer si tu veux garder l’ancien historique." confirmLabel="Remplacer l’historique" onConfirm={importer} onCancel={()=>setConfirmation(false)}/>}
      {error&&<p role="alert" className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{message&&<div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">{message}<div className="mt-3 flex gap-4"><Link href="/dashboard/" className="font-semibold underline">Tableau de bord</Link><Link href="/insulin/" className="font-semibold underline">Voir les injections</Link></div></div>}
    </GlassPanel></PageShell>;
}
