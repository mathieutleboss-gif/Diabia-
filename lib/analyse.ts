import { calculerScore } from "./analyses/score";
import { statistiques } from "./analyses/statistiques";
import { analyserVariations } from "./analyses/variations";
import { analyserHoraires } from "./analyses/horaires";
import { analyserTendance } from "./analyses/tendances";
import { creerResume } from "./analyses/resume";
import { expliquerScore } from "./analyses/explicationScore";
import { analyserJournal } from "./analyses/journalAnalyse";
import { genererInsights } from "./analyses/insights";
import type {
  AnalyseBase,
  JournalEntry,
  Mesure,
  RapportDiabia,
} from "./analyses/types";

function lireJournalLocal(): JournalEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const valeur = JSON.parse(localStorage.getItem("journal") || "[]");
    return Array.isArray(valeur) ? valeur : [];
  } catch {
    return [];
  }
}

export function analyserGlycemie(
  mesures: Mesure[],
  journal: JournalEntry[] = lireJournalLocal()
): RapportDiabia {
  const stats = statistiques(mesures);
  const variations = analyserVariations(mesures);
  const horaires = analyserHoraires(mesures);
  const tendance = analyserTendance(mesures);

  const baseAnalyse: AnalyseBase = {
    moyenne: stats.moyenne,
    cible: stats.cible,
    hyper: stats.hyper,
    hypo: stats.hypo,
    maximum: stats.maximum,
    minimum: stats.minimum,
    variations,
    horaires,
    tendance,
  };

  const resume = creerResume(baseAnalyse);
  const analyseJournal = analyserJournal(mesures, journal);
  const score = calculerScore(baseAnalyse);
  const explication = expliquerScore(baseAnalyse, score);
  const insights = genererInsights(baseAnalyse);

  return {
    ...baseAnalyse,
    score,
    explication,
    journal: analyseJournal,
    insights,
    resume,
    message: `Moyenne : ${stats.moyenne} mg/dL.
${stats.cible}% dans la cible.

${variations.message}

${horaires.message}

${tendance.message}`,
  };
}
