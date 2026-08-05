import type { JournalEntry, Mesure, ProfilDiabia, RapportDiabia } from "./types";

export function creerRapportIA(
  analyse: RapportDiabia,
  profil: ProfilDiabia,
  journal: JournalEntry[],
  mesures: Mesure[] = []
) {
  return {
    profil: {
      diabete: profil.diabete || "Non renseigné",
      appareil: profil.appareil || "Non renseigné",
      objectif: profil.objectif || "Non renseigné",
    },
    glycemie: {
      pourcentageMesuresDansCible: analyse.cible,
      hyperglycemies: analyse.hyper,
      hypoglycemies: analyse.hypo,
      score: analyse.score,
    },
    stabilite: {
      variations: analyse.variations.nombre,
      tendance: analyse.tendance,
    },
    habitudes: {
      journalTotal: journal.length,
      dernierEvenements: journal.slice(-10),
    },
    contexteMesures: mesures.slice(-20).map(({ date, heure, glycemie, insuline, note }) => ({ date, heure, glycemie, insuline, note })),
    resume: analyse.message || "Pas encore de résumé disponible.",
  };
}
