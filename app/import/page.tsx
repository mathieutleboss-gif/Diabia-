"use client";

import { useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import { analyserCSV } from "../../lib/csvParser";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { lireMesuresLocales, sauvegarderLocal } from "../../lib/storage";
import { GlassPanel, PageHero, PageShell } from "../components/PageShell";

type CsvRow = Record<string, unknown>;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  function importerFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    setFileName(fichier.name);
    setMessage("");
    setError("");

    if (fichier.size > MAX_FILE_SIZE) {
      setError("Ce fichier dépasse la taille maximale autorisée de 10 Mo.");
      return;
    }

    Papa.parse<CsvRow>(fichier, {
      header: true,
      complete(result: ParseResult<CsvRow>) {
        const donneesPropres = result.data.filter((ligne) => Object.keys(ligne).length > 1);
        const mesuresImportees = analyserCSV(donneesPropres);

        if (mesuresImportees.length === 0) {
          setError("Aucune ligne exploitable n’a été trouvée. Les mesures existantes ont été conservées.");
          return;
        }

        const mesuresExistantes = lireMesuresLocales().length > 0;
        if (
          mesuresExistantes &&
          !window.confirm("Cet import va remplacer les mesures déjà enregistrées dans ce navigateur. Continuer ?")
        ) {
          setError("Import annulé. Les mesures existantes ont été conservées.");
          return;
        }

        if (sauvegarderLocal(STORAGE_KEYS.mesures, mesuresImportees)) {
          const avertissement = result.errors.length
            ? ` ${result.errors.length} anomalie(s) de lecture signalée(s) par le fichier.`
            : "";
          setMessage(`${mesuresImportees.length} lignes importées avec succès.${avertissement}`);
        } else {
          setError("Le fichier n’a pas pu être enregistré dans ce navigateur. Les mesures existantes ont été conservées.");
        }
      },
      error() {
        setError("Le fichier CSV n’a pas pu être lu. Vérifie son format puis réessaie.");
      },
    });
  }

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Données" title="Importer un fichier CSV" description="Ajoute en une fois tes mesures glycémiques depuis un export compatible." />
      <GlassPanel>
        <label className="group grid min-h-72 cursor-pointer place-items-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50/60">
          <div>
            <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-3xl bg-white text-3xl shadow-lg shadow-slate-200/70 transition group-hover:-translate-y-1">↥</span>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">{fileName || "Choisir un fichier CSV"}</h2>
            <p className="mt-2 text-sm text-slate-500">Colonnes reconnues : glycémie, glucose, insuline et date.</p>
            <span className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Parcourir les fichiers</span>
          </div>
          <input type="file" accept=".csv,text/csv" onChange={importerFichier} className="sr-only" />
        </label>
        {message && <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span aria-hidden="true">✓</span>{message}</div>}
        {error && <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
        <p className="mt-5 text-xs leading-5 text-slate-400">L’import remplace actuellement les mesures déjà présentes dans ce navigateur. Vérifie ton fichier avant de continuer.</p>
      </GlassPanel>
    </PageShell>
  );
}
