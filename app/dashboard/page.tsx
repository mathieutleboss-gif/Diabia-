"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { analyserGlycemie } from "../../lib/analyse";
import type {
  JournalEntry,
  Mesure,
  ProfilDiabia,
} from "../../lib/analyses/types";
import DashboardHeader from "./components/DashboardHeader";
import GlucoseChart from "./components/GlucoseChart";
import InsightsPanel from "./components/InsightsPanel";
import JournalProfile from "./components/JournalProfile";
import MetricCards from "./components/MetricCards";
import ScoreCard from "./components/ScoreCard";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserJournal, normaliserMesures, normaliserProfil } from "../../lib/validation";
import { lireValeurLocale } from "../../lib/storage";
import { obtenirTimestamp } from "../../lib/dates";
import { ROUTES } from "../../lib/routes";

const SERVER_SNAPSHOT = JSON.stringify({
  mesures: "[]",
  profil: "{}",
  journal: "[]",
});

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("diabia:storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("diabia:storage", callback);
  };
}

function readStorageSnapshot() {
  return JSON.stringify({
    mesures: lireValeurLocale(STORAGE_KEYS.mesures, "[]"),
    profil: lireValeurLocale(STORAGE_KEYS.profil, "{}"),
    journal: lireValeurLocale(STORAGE_KEYS.journal, "[]"),
  });
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function parseJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseDashboardData(snapshot: string): {
  mesures: Mesure[];
  profil: ProfilDiabia;
  journal: JournalEntry[];
} {
  const raw = parseJson(snapshot, {}) as Partial<
    Record<"mesures" | "profil" | "journal", string>
  >;
  const mesures = normaliserMesures(parseJson(raw.mesures || "[]", []));
  const profil = normaliserProfil(parseJson(raw.profil || "{}", {}));
  const journal = normaliserJournal(parseJson(raw.journal || "[]", []));

  return {
    mesures,
    profil,
    journal,
  };
}

export default function Dashboard() {
  const [periode, setPeriode] = useState("all");
  const [referenceTemporelle] = useState(() => Date.now());
  const snapshot = useSyncExternalStore(
    subscribeToStorage,
    readStorageSnapshot,
    getServerSnapshot
  );
  const { mesures, profil, journal } = useMemo(
    () => parseDashboardData(snapshot),
    [snapshot]
  );
  const mesuresAnalysees = useMemo(() => {
    if (periode === "all") return mesures;
    const limite = referenceTemporelle - Number(periode) * 24 * 60 * 60 * 1000;
    return mesures.filter((mesure) => {
      const timestamp = obtenirTimestamp(mesure);
      return timestamp !== null && timestamp >= limite;
    });
  }, [mesures, periode, referenceTemporelle]);
  const analyse = useMemo(
    () => analyserGlycemie(mesuresAnalysees, journal),
    [mesuresAnalysees, journal]
  );
  const hasData = analyse.nombreMesures > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.13),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,0.10),transparent_28%)]" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
        <DashboardHeader
          prenom={profil.prenom}
          nombreMesures={mesuresAnalysees.length}
        />

        {!hasData ? (
          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Premiers pas</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ajoute tes premières mesures</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Saisis une mesure manuellement ou importe un fichier CSV. Le score, la courbe et les analyses apparaîtront dès qu’une mesure valide sera disponible.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.ajoutMesure} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Ajouter une mesure</Link>
              <Link href={ROUTES.import} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700">Importer un CSV</Link>
            </div>
          </section>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-semibold text-slate-900">Période analysée</p><p className="text-xs text-slate-500">Les mesures sans date sont incluses uniquement dans « Tout l’historique ».</p></div>
              <select aria-label="Période analysée" value={periode} onChange={(event) => setPeriode(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"><option value="7">7 derniers jours</option><option value="14">14 derniers jours</option><option value="30">30 derniers jours</option><option value="all">Tout l’historique</option></select>
            </div>

            <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
              <ScoreCard score={analyse.score} moyenne={analyse.moyenne} minimum={analyse.minimum} maximum={analyse.maximum} hasData={hasData} />
              <GlucoseChart mesures={mesuresAnalysees} />
            </section>

            <MetricCards cible={analyse.cible} hyper={analyse.hyper} hypo={analyse.hypo} variations={analyse.variations.nombre} hasData={hasData} />

            <InsightsPanel analyse={analyse} hasData={hasData} />
          </>
        )}

        <JournalProfile journal={journal} profil={profil} />

        <footer className="flex flex-col gap-2 px-2 pb-3 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Les analyses Diabia sont informatives et ne remplacent pas un avis médical.</p>
          <p>Les données affichées restent stockées dans ce navigateur.</p>
        </footer>
      </div>
    </main>
  );
}
