import { calculerScore } from "./analyses/score";
import { statistiques } from "./analyses/statistiques";
import { analyserVariations } from "./analyses/variations";
import { analyserHoraires } from "./analyses/horaires";
import { analyserTendance } from "./analyses/tendances";
import { creerResume } from "./analyses/resume";
import { expliquerScore } from "./analyses/explicationScore";
import { analyserJournal } from "./analyses/journalAnalyse";
import { genererInsights } from "./analyses/insights";
import { trierMesuresChronologiquement } from "./dates";
import type { AnalyseBase, JournalEntry, Mesure, RapportDiabia } from "./analyses/types";

export function analyserGlycemie(
  mesures: Mesure[],
  journal: JournalEntry[] = []
): RapportDiabia {
  const mesuresValides = mesures.filter((mesure) => {
    if (typeof mesure.glycemie === "string" && !mesure.glycemie.trim()) return false;
    const valeur = Number(mesure.glycemie);
    return Number.isFinite(valeur) && valeur > 0;
  });
  const mesuresOrdonnees = trierMesuresChronologiquement(mesuresValides);
  const stats = statistiques(mesuresOrdonnees);
  const variations = analyserVariations(mesuresOrdonnees);
  const horaires = analyserHoraires(mesuresOrdonnees);
  const tendance = analyserTendance(mesuresOrdonnees);

  const baseAnalyse: AnalyseBase = {
    nombreMesures: mesuresOrdonnees.length,
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
  const analyseJournal = analyserJournal(mesuresOrdonnees, journal);
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
