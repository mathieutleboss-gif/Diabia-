"use client";

import { useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import { analyserCSV } from "../../lib/csvParser";
import { GlassPanel, PageHero, PageShell } from "../components/PageShell";

type CsvRow = Record<string, unknown>;

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  function importerFichier(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    if (!fichier) return;
    setFileName(fichier.name);
    Papa.parse<CsvRow>(fichier, {
      header: true,
      complete(result: ParseResult<CsvRow>) {
        const donneesPropres = result.data.filter((ligne) => Object.keys(ligne).length > 1);
        localStorage.setItem("mesures", JSON.stringify(analyserCSV(donneesPropres)));
        setMessage(`${donneesPropres.length} lignes importées avec succès.`);
      },
    });
  }

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Données" title="Importer un fichier CSV" description="Ajoute en une fois tes mesures glycémiques depuis un export compatible." />
      <GlassPanel>
        <label className="group grid min-h-72 cursor-pointer place-items-center rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50/60">
          <div>
            <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-white text-3xl shadow-lg shadow-slate-200/70 transition group-hover:-translate-y-1">↥</span>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">{fileName || "Choisir un fichier CSV"}</h2>
            <p className="mt-2 text-sm text-slate-500">Colonnes reconnues : glycémie, glucose, insuline et date.</p>
            <span className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Parcourir les fichiers</span>
          </div>
          <input type="file" accept=".csv,text/csv" onChange={importerFichier} className="sr-only" />
        </label>
        {message && <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>✓</span>{message}</div>}
        <p className="mt-5 text-xs leading-5 text-slate-400">L’import remplace actuellement les mesures déjà présentes dans ce navigateur. Vérifie ton fichier avant de continuer.</p>
      </GlassPanel>
    </PageShell>
  );
}
