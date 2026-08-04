"use client";

import { useMemo, useSyncExternalStore } from "react";
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

const SERVER_SNAPSHOT = JSON.stringify({
  mesures: "[]",
  profil: "{}",
  journal: "[]",
});

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
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
  const snapshot = useSyncExternalStore(
    subscribeToStorage,
    readStorageSnapshot,
    getServerSnapshot
  );
  const { mesures, profil, journal } = useMemo(
    () => parseDashboardData(snapshot),
    [snapshot]
  );
  const analyse = useMemo(
    () => analyserGlycemie(mesures, journal),
    [mesures, journal]
  );
  const hasData = analyse.nombreMesures > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.13),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(139,92,246,0.10),transparent_28%)]" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
        <DashboardHeader
          prenom={profil.prenom}
          nombreMesures={mesures.length}
        />

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
          <ScoreCard
            score={analyse.score}
            moyenne={analyse.moyenne}
            minimum={analyse.minimum}
            maximum={analyse.maximum}
            hasData={hasData}
          />
          <GlucoseChart mesures={mesures} />
        </section>

        <MetricCards
          cible={analyse.cible}
          hyper={analyse.hyper}
          hypo={analyse.hypo}
          variations={analyse.variations.nombre}
          hasData={hasData}
        />

        <InsightsPanel analyse={analyse} hasData={hasData} />

        <JournalProfile journal={journal} profil={profil} />

        <footer className="flex flex-col gap-2 px-2 pb-3 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Les analyses Diabia sont informatives et ne remplacent pas un avis médical.</p>
          <p>Les données affichées restent stockées dans ce navigateur.</p>
        </footer>
      </div>
    </main>
  );
}
