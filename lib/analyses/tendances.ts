import type { Mesure } from "./types";

function moyenne(liste: Mesure[]): number {
  const valeurs = liste.map((mesure) => Number(mesure.glycemie));
  return Math.round(
    valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length
  );
}

export function analyserTendance(mesures: Mesure[]) {
  if (mesures.length < 4) {
    return { message: "Pas assez de données pour analyser la tendance." };
  }

  const milieu = Math.floor(mesures.length / 2);
  const moyenneDebut = moyenne(mesures.slice(0, milieu));
  const moyenneFin = moyenne(mesures.slice(milieu));
  const difference = moyenneFin - moyenneDebut;

  let message = "La tendance glycémique reste globalement stable sur la période.";
  if (difference > 20) {
    message = `La glycémie moyenne augmente sur la période (+${difference} mg/dL). Diabia détecte une dégradation récente.`;
  } else if (difference < -20) {
    message = `La glycémie moyenne diminue sur la période (${difference} mg/dL). Diabia détecte une amélioration récente.`;
  }

  return { moyenneDebut, moyenneFin, difference, message };
}
