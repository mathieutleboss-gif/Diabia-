import type { JournalEntry, ProfilDiabia, RapportDiabia } from "./types";

export function creerRapportIA(
  analyse: RapportDiabia,
  profil: ProfilDiabia,
  journal: JournalEntry[]
) {
  return {
    profil: {
      diabete: profil.diabete || "Non renseigné",
      appareil: profil.appareil || "Non renseigné",
      objectif: profil.objectif || "Non renseigné",
    },
    glycemie: {
      tempsDansCible: analyse.cible,
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
    resume: analyse.message || "Pas encore de résumé disponible.",
  };
}
