"use client";

import { useState } from "react";
import Papa, { type ParseConfig, type ParseResult } from "papaparse";
import ConfirmDialog from "../components/ConfirmDialog";
import { fusionnerMesures } from "../../lib/mesures";
import { formaterDose, lireDoseInsuline } from "../../lib/insuline";
import { analyserCSVDetaille, type CsvParseResult } from "../../lib/csvParser";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { lireMesuresLocales, lireProfilLocal, sauvegarderLocal } from "../../lib/storage";
import type { GlucoseUnit } from "../../lib/glucoseUnits";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import Link from "next/link";
import { ROUTES } from "../../lib/routes";

type CsvRow = Record<string, unknown>;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [unite, setUnite] = useState<GlucoseUnit>(() => lireProfilLocal().uniteGlycemie || "mg/dL");
  const [apercu, setApercu] = useState<CsvParseResult | null>(null);
  const [erreursLecture, setErreursLecture] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [mode, setMode] = useState<"fusion" | "remplacement">("fusion");
  const [confirmation, setConfirmation] = useState(false);

  function importerFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    event.target.value = "";
    if (!fichier) return;
    setFileName(fichier.name);
    setMessage("");
    setError("");
    setApercu(null);
    setLecture(true);

    if (fichier.size > MAX_FILE_SIZE) {
      setError("Ce fichier dépasse la taille maximale autorisée de 10 Mo.");
      setLecture(false);
      return;
    }

    const config: ParseConfig<CsvRow> & { worker: boolean } = {
      header: true,
      worker: true,
      complete(result: ParseResult<CsvRow>) {
        setLecture(false);
        if (result.errors.length) { setError("Le CSV présente des erreurs de structure (colonnes ou guillemets). Corrige le fichier avant de l’importer ; aucune mesure n’a été enregistrée."); return; }
        const lignesNonVides = result.data.filter((ligne) =>
          Object.values(ligne).some((value) => String(value ?? "").trim() !== "")
        );
        const analyse = analyserCSVDetaille(lignesNonVides, unite);
        setErreursLecture(result.errors.length);
        if (!analyse.mesures.length) {
          setError("Aucune ligne exploitable : une glycémie et une date valides sont obligatoires.");
          return;
        }
        setApercu(analyse);
      },
      error() {
        setLecture(false);
        setError("Le fichier CSV n’a pas pu être lu. Vérifie son format puis réessaie.");
      },
    };
    try { Papa.parse<CsvRow>(fichier, config); } catch { setLecture(false); setError("Impossible de lire ce fichier. Aucune donnée n’a été modifiée."); }
  }

  function confirmerImport() {
    if (!apercu) return;
    const fusion = fusionnerMesures(mode === "fusion" ? lireMesuresLocales() : [], apercu.mesures);
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, fusion.mesures)) {
      setError("Le fichier n’a pas pu être enregistré. Les mesures existantes ont été conservées.");
      return;
    }
    setError("");
    setMessage(`${fusion.ajoutees} mesure(s) ajoutée(s). ${fusion.doublons} doublon(s) identique(s) ignoré(s).`);
    setConfirmation(false);
    setApercu(null);
  }

  const remplacement = lireMesuresLocales().length > 0;

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Données" title="Importer un fichier CSV" description="Prévisualise tes mesures, conserve ton historique et évite les doublons lors des réimports." />
      <GlassPanel>
        <div className="mb-6 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-900">Format attendu</p>
          <p className="mt-1">Les colonnes glycémie (ou glucose) et date sont obligatoires. L’heure, l’insuline et la note sont facultatives. Les dates peuvent utiliser le format JJ/MM/AAAA ou AAAA-MM-JJ.</p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-white p-3 text-xs text-slate-600">glycémie,date,heure,insuline,note{"\n"}120,05/08/2026,08:30,4,Petit-déjeuner</pre>
          <p className="mt-3 font-medium text-amber-800">Par défaut, l’import ajoute les nouvelles mesures et ignore les enregistrements strictement identiques. Tu peux choisir de remplacer l’historique, avec une confirmation supplémentaire.</p>
        </div>
        <div className="mb-5 max-w-xs">
          <FormField label="Unité du fichier">
            <select disabled={lecture} className={fieldClassName} value={unite} onChange={(event) => { setUnite(event.target.value as GlucoseUnit); setApercu(null); }}>
              <option>mg/dL</option><option>g/L</option><option>mmol/L</option>
            </select>
          </FormField>
        </div>
        <label className="group grid min-h-64 cursor-pointer place-items-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50/60">
          <div>
            <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-3xl bg-white text-3xl shadow-lg">↥</span>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">{fileName || "Choisir un fichier CSV"}</h2>
            <p className="mt-2 text-sm text-slate-500">Colonnes : glycémie/glucose, date, heure, insuline et note.</p>
            <span className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{lecture ? "Analyse en cours…" : "Parcourir"}</span>
          </div>
          <input type="file" disabled={lecture} accept=".csv,text/csv" onChange={importerFichier} className="sr-only" />
        </label>

        {apercu && (
          <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/60 p-5" aria-labelledby="titre-apercu">
            <h2 id="titre-apercu" className="text-lg font-semibold text-slate-950">Aperçu avant import</h2>
            <p className="mt-1 text-sm text-slate-600">{apercu.mesures.length} mesure{apercu.mesures.length > 1 ? "s" : ""} valide{apercu.mesures.length > 1 ? "s" : ""}, {apercu.lignesRejetees} ligne{apercu.lignesRejetees > 1 ? "s" : ""} rejetée{apercu.lignesRejetees > 1 ? "s" : ""}, {erreursLecture} anomalie{erreursLecture > 1 ? "s" : ""} de lecture.</p>
            <p className="mt-1 text-xs text-slate-500">Colonnes détectées : {apercu.colonnesDetectees.join(", ") || "aucune"}.</p>
            {apercu.rejets.length > 0 && <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm text-amber-900"><p className="font-semibold">Premières lignes rejetées</p><ul className="mt-2 space-y-1">{apercu.rejets.slice(0, 5).map((rejet) => <li key={`${rejet.ligne}-${rejet.raison}`}>Ligne {rejet.ligne} : {rejet.raison}</li>)}</ul>{apercu.rejets.length > 5 && <p className="mt-2 text-xs">Et {apercu.rejets.length - 5} autre{apercu.rejets.length - 5 > 1 ? "s" : ""} ligne{apercu.rejets.length - 5 > 1 ? "s" : ""} rejetée{apercu.rejets.length - 5 > 1 ? "s" : ""}.</p>}</div>}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="text-slate-500"><tr><th className="p-2">Date</th><th className="p-2">Heure</th><th className="p-2">Glycémie</th><th className="p-2">Insuline (U)</th></tr></thead>
                <tbody>{apercu.mesures.slice(0, 5).map((mesure, index) => <tr key={`${mesure.timestamp}-${index}`} className="border-t border-blue-100"><td className="p-2">{mesure.date}</td><td className="p-2">{mesure.heure || "—"}</td><td className="p-2 font-semibold">{mesure.glycemie} mg/dL</td><td className="p-2">{lireDoseInsuline(mesure.insuline) === null ? "Non renseignée" : `${formaterDose(lireDoseInsuline(mesure.insuline)!)} U`}</td></tr>)}</tbody>
              </table>
            </div>
            <fieldset className="mt-5 grid gap-3 rounded-2xl bg-white p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Comment intégrer ces mesures ?</legend><label className="flex items-center gap-3 text-sm"><input type="radio" name="mode-import" checked={mode === "fusion"} onChange={() => setMode("fusion")} className="accent-blue-600" />Ajouter à mon historique (recommandé)</label><label className="flex items-center gap-3 text-sm"><input type="radio" name="mode-import" checked={mode === "remplacement"} onChange={() => setMode("remplacement")} className="accent-blue-600" />Remplacer mes mesures actuelles</label><p className="text-xs leading-5 text-slate-500">Un doublon a la même date et heure, la même glycémie, la même dose et la même note. Les doses manquantes restent non renseignées.</p></fieldset>
            {mode === "remplacement" && remplacement && <p className="mt-4 text-sm font-medium text-amber-800">Le remplacement effacera l’historique des mesures actuel. Exporte d’abord une sauvegarde depuis Profil.</p>}
            <button type="button" onClick={() => { if (mode === "remplacement" && remplacement) setConfirmation(true); else confirmerImport(); }} className={`${primaryButtonClassName} mt-4`}>Confirmer l’import</button>
          </section>
        )}
        {confirmation && <ConfirmDialog title="Remplacer tout l’historique des mesures ?" description="Les mesures actuelles seront remplacées par celles du CSV. Le profil et le journal seront conservés. Cette action ne peut pas être annulée sans sauvegarde." confirmLabel="Remplacer les mesures" onConfirm={confirmerImport} onCancel={() => setConfirmation(false)} />}
        {message && <div role="status" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><p>✓ {message}</p><div className="mt-3 flex flex-wrap gap-3"><Link href={ROUTES.dashboard} className="font-semibold underline">Voir le Dashboard</Link><Link href={ROUTES.mesures} className="font-semibold underline">Voir les mesures</Link></div></div>}
        {error && <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
      </GlassPanel>
    </PageShell>
  );
}
