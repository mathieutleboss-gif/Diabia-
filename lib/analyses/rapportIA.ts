import type { JournalEntry, Mesure, ProfilDiabia, RapportDiabia } from "./types";
import { obtenirTimestamp } from "../dates";

export function creerRapportIA(
  analyse: RapportDiabia,
  profil: ProfilDiabia,
  journal: JournalEntry[],
  mesures: Mesure[] = []
) {
  const mesuresOrdonnees = mesures
    .map((mesure) => ({ mesure, temps: obtenirTimestamp(mesure) ?? Number.NaN }))
    .sort((a, b) => (Number.isFinite(a.temps) ? a.temps : 0) - (Number.isFinite(b.temps) ? b.temps : 0))
    .map(({ mesure }) => mesure);
  const journalOrdonne = journal
    .map((entree) => ({ entree, temps: obtenirTimestamp(entree) ?? Number.NaN }))
    .sort((a, b) => (Number.isFinite(a.temps) ? a.temps : 0) - (Number.isFinite(b.temps) ? b.temps : 0))
    .map(({ entree }) => entree);

  return {
    schemaVersion: 2,
    nature: "rapport_analyse_donnees_non_medical",
    gardeFous: {
      diagnosticInterdit: true,
      prescriptionInterdite: true,
      causaliteNonProuvee: true,
      objectifsAIndividualiser: true,
    },
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
      dernierEvenements: journalOrdonne.slice(-20),
    },
    analyseAvancee: analyse.avance,
    contexteMesures: mesuresOrdonnees.slice(-50).map(({ date, heure, timestamp, glycemie, insuline, note }) => ({ date, heure, timestamp, glycemie, insuline, note })),
    resume: analyse.message || "Pas encore de résumé disponible.",
  };
}
