import type { InjectionInsuline, Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { convertirEnMgDl, type GlucoseUnit } from "./glucoseUnits";
import { LIMITES_SAISIE, validerGlycemieMgDl, validerInsuline } from "./saisie";
export type CsvRow = Record<string, unknown>;
export type CsvMapping = Partial<Record<"glycemie"|"glycemieSecondaire"|"insuline"|"insulineBasale"|"date"|"heure"|"timestamp"|"note"|"typeInsuline", string>>;
export type CsvParseResult = { mesures: Mesure[]; injections: InjectionInsuline[]; lignesRejetees: number; colonnesDetectees: string[]; rejets: Array<{ligne:number;raison:string}> };
/** Des noms uniques même si le fichier contient déjà des suffixes « (2) ». */
export function nommerColonnesCSV(row: unknown[] = []): string[] {
  const utilises = new Set<string>();
  return row.map((value, index) => {
    const base = String(value ?? "").trim() || `Colonne ${index + 1}`;
    let name = base, suffixe = 2;
    while (utilises.has(name)) name = `${base} (${suffixe++})`;
    utilises.add(name);
    return name;
  });
}
export function normaliserColonne(value:string) {return value.replace(/^\uFEFF/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/\s+/g," ");}
const aliases: Record<keyof CsvMapping,string[]> = {
  glycemie:["glycemie","glucose","sg","glucose value (mg/dl)","glucose value (mmol/l)","historic glucose mg/dl","historic glucose mmol/l","historique de la glycemie mg/dl","historique de la glycemie mmol/l","glucose (mg/dl)","glucose (mmol/l)"],
  glycemieSecondaire:["scan glucose mg/dl","scan glucose mmol/l","glycemie scannee mg/dl","glycemie scannee mmol/l"],
  insuline:["insuline","insulin","insulin (u)","insuline (u)","insulin value (u)","insulin dose (units)","dose insuline (u)","bolus volume delivered (u)","rapid-acting insulin (units)","insuline a action rapide (unites)","insuline rapide (unites)"],
  insulineBasale:["long-acting insulin (units)","insuline a action lente (unites)","insuline lente (unites)","insuline basale (unites)"],
  typeInsuline:["type_insuline","type insuline"],
  date:["date"],heure:["heure","time"], timestamp:["timestamp","horodatage","device timestamp","horodatage du dispositif","timestamp (yyyy-mm-ddthh:mm:ss)","date time"], note:["note","notes","commentaire","comment"],
};
export function detecterColonnes(headers:string[]):CsvMapping {
  const mapping:CsvMapping={};
  for(const field of Object.keys(aliases) as Array<keyof CsvMapping>){const col=headers.find(h=>aliases[field].includes(normaliserColonne(h)));if(col)mapping[field]=col;}
  return mapping;
}
export function detecterUniteColonne(header:string):GlucoseUnit|null {
  const h=normaliserColonne(header); return /mmol\s*\/\s*l/.test(h)?"mmol/L":/mg\s*\/\s*dl/.test(h)?"mg/dL":/g\s*\/\s*l/.test(h)?"g/L":null;
}
export function choisirEntete(rows:unknown[][]):number {
  let meilleur=0,score=0;
  rows.slice(0,40).forEach((row,i)=>{const m=detecterColonnes(row.map(String));const s=Object.keys(m).length+(m.timestamp||m.date?3:0)+(m.glycemie||m.glycemieSecondaire||m.insuline||m.insulineBasale?3:0);if(s>score){score=s;meilleur=i;}});
  return meilleur;
}
function nombre(v:unknown) {const s=String(v??"").trim().replace(",", ".");return /^\d+(?:\.\d+)?$/.test(s)?Number(s):NaN;}
export function analyserCSVDetaille(lignes:CsvRow[],unite:GlucoseUnit="mg/dL",options:{mapping?:CsvMapping;separerInjections?:boolean;premiereLigne?:number}={}):CsvParseResult {
  const colonnesDetectees=Array.from(new Set(lignes.flatMap(Object.keys)));
  const mapping=options.mapping??detecterColonnes(colonnesDetectees);
  const mesures:Mesure[]=[],injections:InjectionInsuline[]=[],rejets:CsvParseResult["rejets"]=[];
  for(const col of [mapping.glycemie,mapping.glycemieSecondaire]){const indiquee=col?detecterUniteColonne(col):null;if(indiquee&&indiquee!==unite)return {mesures,injections,lignesRejetees:lignes.length,colonnesDetectees,rejets:[{ligne:1,raison:`La colonne ${col} indique ${indiquee}, mais l’unité choisie est ${unite}. Corriger l’unité ou la colonne.`}]};}
  const choisies=Object.values(mapping).filter(Boolean);
  if(new Set(choisies).size!==choisies.length)return {mesures,injections,lignesRejetees:lignes.length,colonnesDetectees,rejets:[{ligne:1,raison:"Une colonne est choisie plusieurs fois. Vérifier les correspondances."}]};
  const lire=(row:CsvRow,key:keyof CsvMapping)=>{const col=mapping[key];if(!col)return undefined;const v=row[col];return v===undefined||v===null||String(v).trim()===""?undefined:v;};
  lignes.forEach((row,index)=>{
    if(Object.values(row).every(v=>v===undefined||v===null||String(v).trim()===""))return;
    const rejeter=(raison:string)=>rejets.push({ligne:index+(options.premiereLigne??2),raison});
    const g=lire(row,"glycemie")??lire(row,"glycemieSecondaire"),r=lire(row,"insuline"),b=lire(row,"insulineBasale");
    if(g===undefined&&r===undefined&&b===undefined){rejeter("Aucune glycémie ou dose dans les colonnes choisies.");return;}
    const texteDate=lire(row,"timestamp")??lire(row,"date");
    if(texteDate===undefined){rejeter("Date ou horodatage obligatoire manquant.");return;}
    const date=String(texteDate).trim(),heure=lire(row,"heure");
    const temps=mapping.timestamp&&lire(row,"timestamp")!==undefined ? obtenirTimestamp({timestamp:date})??obtenirTimestamp({date}) : obtenirTimestamp({date,heure:heure===undefined?undefined:String(heure).trim()});
    if(temps===null||temps>Date.now()+300000){rejeter("Date invalide ou située dans le futur.");return;}
    const doses:Array<{dose:number;type:InjectionInsuline["type"]}>=[];
    for(const [key,raw,type] of [["insuline",r,"non_precise"],["insulineBasale",b,"basale"]] as const){
      if(raw===undefined)continue;
      if(/\/\s*h|per hour|par heure|basal rate|debit|u\.h/i.test(mapping[key]||"")){rejeter("Un débit d’insuline (U/h) n’est pas une dose administrée (U).");return;}
      const dose=nombre(raw),erreur=validerInsuline(dose);if(erreur){rejeter(erreur);return;}const typeBrut=lire(row,"typeInsuline");
      const categorie=key === "insulineBasale" ? "basale" : typeBrut===undefined ? (type === "non_precise" && /rapid|rapide/i.test(mapping.insuline||"") ? "rapide" : type) : String(typeBrut).trim();
      if(!["non_precise","rapide","basale"].includes(categorie)){rejeter("Type d’insuline non reconnu : vérifier la colonne choisie.");return;}
      doses.push({dose,type:categorie as InjectionInsuline["type"]});
    }
    let glucose:number|undefined;
    if(g!==undefined){glucose=convertirEnMgDl(nombre(g),unite);const err=validerGlycemieMgDl(glucose);if(err){rejeter(err);return;}}
    const d=new Date(temps),dateAffichee=d.toLocaleDateString("fr-FR"),heureAffichee=d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",...(d.getSeconds()?{second:"2-digit" as const}:{})});
    const note=String(lire(row,"note")??"Import CSV").trim().slice(0,LIMITES_SAISIE.noteMax);
    if(glucose!==undefined)mesures.push({id:crypto.randomUUID(),glycemie:glucose,date:dateAffichee,heure:heureAffichee,timestamp:d.toISOString(),note,...(!options.separerInjections&&doses.length===1?{insuline:doses[0].dose}:{})});
    if(options.separerInjections||glucose===undefined||doses.length>1)for(const dose of doses)injections.push({id:crypto.randomUUID(),dose:dose.dose,type:dose.type,date:dateAffichee,heure:heureAffichee,timestamp:d.toISOString(),source:"csv",note});
  });
  return {mesures,injections,lignesRejetees:rejets.length,colonnesDetectees,rejets};
}
export function analyserCSV(lignes:CsvRow[],unite:GlucoseUnit="mg/dL"):Mesure[]{return analyserCSVDetaille(lignes,unite).mesures;}
