import type { Mesure } from "./types";

type Variation = {
  difference: number;
  avant: number;
  apres: number;
  date?: string;
  heure?: string;
};

export function analyserVariations(mesures: Mesure[]) {
  if (mesures.length < 2) {
    return {
      nombre: 0,
      message: "Pas assez de mesures pour analyser les variations.",
    };
  }

  const variations: Variation[] = [];

  for (let index = 1; index < mesures.length; index += 1) {
    const avant = Number(mesures[index - 1].glycemie);
    const apres = Number(mesures[index].glycemie);
    const difference = apres - avant;

    if (Math.abs(difference) >= 50) {
      variations.push({
        difference,
        avant,
        apres,
        date: mesures[index].date,
        heure: mesures[index].heure || "",
      });
    }
  }

  if (variations.length === 0) {
    return {
      nombre: 0,
      message: "Aucune variation importante détectée.",
    };
  }

  const plusGrande = variations.reduce((actuelle, variation) =>
    Math.abs(variation.difference) > Math.abs(actuelle.difference) ? variation : actuelle
  );
  const message = plusGrande.difference > 0
    ? `Diabia détecte une montée importante de +${plusGrande.difference} mg/dL le ${plusGrande.date} à ${plusGrande.heure}. Passage de ${plusGrande.avant} à ${plusGrande.apres} mg/dL.`
    : `Diabia détecte une baisse importante de ${plusGrande.difference} mg/dL le ${plusGrande.date} à ${plusGrande.heure}. Passage de ${plusGrande.avant} à ${plusGrande.apres} mg/dL.`;

  return {
    nombre: variations.length,
    variations,
    message,
  };
}
