"use client";

import { useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import { analyserCSVDetaille, type CsvParseResult } from "../../lib/csvParser";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { lireMesuresLocales, lireProfilLocal, sauvegarderLocal } from "../../lib/storage";
import type { GlucoseUnit } from "../../lib/glucoseUnits";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

type CsvRow = Record<string, unknown>;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [unite, setUnite] = useState<GlucoseUnit>(() => lireProfilLocal().uniteGlycemie || "mg/dL");
  const [apercu, setApercu] = useState<CsvParseResult | null>(null);
  const [erreursLecture, setErreursLecture] = useState(0);

  function importerFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    setFileName(fichier.name);
    setMessage("");
    setError("");
    setApercu(null);

    if (fichier.size > MAX_FILE_SIZE) {
      setError("Ce fichier dépasse la taille maximale autorisée de 10 Mo.");
      return;
    }

    Papa.parse<CsvRow>(fichier, {
      header: true,
      complete(result: ParseResult<CsvRow>) {
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
        setError("Le fichier CSV n’a pas pu être lu. Vérifie son format puis réessaie.");
      },
    });
  }

  function confirmerImport() {
    if (!apercu) return;
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, apercu.mesures)) {
      setError("Le fichier n’a pas pu être enregistré. Les mesures existantes ont été conservées.");
      return;
    }
    setError("");
    setMessage(`${apercu.mesures.length} mesure(s) importée(s).`);
    setApercu(null);
  }

  const remplacement = lireMesuresLocales().length > 0;

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Données" title="Importer un fichier CSV" description="Prévisualise et contrôle tes mesures avant de remplacer les données actuelles." />
      <GlassPanel>
        <div className="mb-5 max-w-xs">
          <FormField label="Unité du fichier">
            <select className={fieldClassName} value={unite} onChange={(event) => { setUnite(event.target.value as GlucoseUnit); setApercu(null); }}>
              <option>mg/dL</option><option>g/L</option><option>mmol/L</option>
            </select>
          </FormField>
        </div>
        <label className="group grid min-h-64 cursor-pointer place-items-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50/60">
          <div>
            <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-3xl bg-white text-3xl shadow-lg">↥</span>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">{fileName || "Choisir un fichier CSV"}</h2>
            <p className="mt-2 text-sm text-slate-500">Colonnes : glycémie/glucose, date, heure, insuline et note.</p>
            <span className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Parcourir</span>
          </div>
          <input type="file" accept=".csv,text/csv" onChange={importerFichier} className="sr-only" />
        </label>

        {apercu && (
          <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/60 p-5" aria-labelledby="titre-apercu">
            <h2 id="titre-apercu" className="text-lg font-semibold text-slate-950">Aperçu avant import</h2>
            <p className="mt-1 text-sm text-slate-600">{apercu.mesures.length} valide(s), {apercu.lignesRejetees} rejetée(s), {erreursLecture} anomalie(s) de lecture.</p>
            <p className="mt-1 text-xs text-slate-500">Colonnes détectées : {apercu.colonnesDetectees.join(", ") || "aucune"}.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="text-slate-500"><tr><th className="p-2">Date</th><th className="p-2">Heure</th><th className="p-2">Glycémie</th><th className="p-2">Insuline</th></tr></thead>
                <tbody>{apercu.mesures.slice(0, 5).map((mesure, index) => <tr key={`${mesure.timestamp}-${index}`} className="border-t border-blue-100"><td className="p-2">{mesure.date}</td><td className="p-2">{mesure.heure || "—"}</td><td className="p-2 font-semibold">{mesure.glycemie} mg/dL</td><td className="p-2">{mesure.insuline || "—"}</td></tr>)}</tbody>
              </table>
            </div>
            {remplacement && <p className="mt-4 text-sm font-medium text-amber-800">Attention : confirmer remplacera les mesures actuellement enregistrées.</p>}
            <button type="button" onClick={confirmerImport} className={`${primaryButtonClassName} mt-4`}>Confirmer l’import</button>
          </section>
        )}
        {message && <div role="status" className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">✓ {message}</div>}
        {error && <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
      </GlassPanel>
    </PageShell>
  );
}
