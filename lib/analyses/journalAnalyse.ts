import { obtenirTimestamp } from "../dates";
import type { JournalEntry, Mesure } from "./types";

export function analyserJournal(mesures: Mesure[], journal: JournalEntry[]) {
  if (!mesures.length || !journal.length) {
    return { message: "Pas assez de données du journal pour analyser les liens." };
  }

  const remarques: string[] = [];
  const repas = journal.filter((item) => item.type === "Repas");

  repas.forEach((repas) => {
    const timestampRepas = obtenirTimestamp(repas);
    if (timestampRepas === null) return;
    const apresRepas = mesures.filter((mesure) => {
      const timestampMesure = obtenirTimestamp(mesure);
      if (timestampMesure === null) return false;
      const delai = timestampMesure - timestampRepas;
      return delai >= 0 && delai <= 3 * 60 * 60 * 1000;
    });
    const hyper = apresRepas.filter((mesure) => Number(mesure.glycemie) > 180);

    if (hyper.length > apresRepas.length / 2) {
      remarques.push(
        `Après le repas "${repas.description}", Diabia remarque souvent une hausse de glycémie.`
      );
    }
  });

  if (remarques.length === 0) {
    remarques.push(
      "Diabia n'a pas encore trouvé de lien évident entre les événements et les variations."
    );
  }

  return { message: remarques.join("\n"), remarques };
}
