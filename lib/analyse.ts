import { RapportDiabia } from "./analyses/types";

import { calculerScore } from "./analyses/score";
import { statistiques } from "./analyses/statistiques";
import { analyserVariations } from "./analyses/variations";
import { analyserHoraires } from "./analyses/horaires";
import { analyserTendance } from "./analyses/tendances";
import { creerResume } from "./analyses/resume";
import { expliquerScore } from "./analyses/explicationScore";
import { analyserJournal } from "./analyses/journalAnalyse";
import { genererInsights } from "./analyses/insights";

export function analyserGlycemie(mesures: any[]): RapportDiabia {

  const journal =
typeof window !== "undefined"
  ? JSON.parse(localStorage.getItem("journal") || "[]")
  : [];

  const stats = statistiques(mesures);

  const variations = analyserVariations(mesures);

  const horaires = analyserHoraires(mesures);

  const tendance = analyserTendance(mesures);

  const baseAnalyse = {
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

  const analyseJournal =
    analyserJournal(mesures, journal);

  const score =
    calculerScore(baseAnalyse);

  const explication =
  expliquerScore(baseAnalyse, score);

const insights =
  genererInsights(baseAnalyse);
  return {

    score,

    moyenne: stats.moyenne,
    cible: stats.cible,
    hyper: stats.hyper,
    hypo: stats.hypo,

    maximum: stats.maximum,
    minimum: stats.minimum,

    variations,

    horaires,

    tendance,

    explication,

    journal: analyseJournal,
insights,
    resume,

    message:

`Moyenne : ${stats.moyenne} mg/dL.
${stats.cible}% dans la cible.

${variations.message}

${horaires.message}

${tendance.message}`

  };

}