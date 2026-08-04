import type { Mesure } from "./types";

export function statistiques(mesures: Mesure[]) {
  const valeurs = mesures.map((mesure) => Number(mesure.glycemie));

  if (valeurs.length === 0) {
    return {
      moyenne: 0,
      cible: 0,
      hyper: 0,
      hypo: 0,
      maximum: 0,
      minimum: 0,
    };
  }

  const moyenne = Math.round(
    valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length
  );
  const cible = valeurs.filter((valeur) => valeur >= 70 && valeur <= 180).length;
  const hyper = valeurs.filter((valeur) => valeur > 180).length;
  const hypo = valeurs.filter((valeur) => valeur < 70).length;
  const extremes = valeurs.reduce(
    (resume, valeur) => ({
      maximum: Math.max(resume.maximum, valeur),
      minimum: Math.min(resume.minimum, valeur),
    }),
    { maximum: Number.NEGATIVE_INFINITY, minimum: Number.POSITIVE_INFINITY }
  );

  return {
    moyenne,
    cible: Math.round((cible / valeurs.length) * 100),
    hyper: Math.round((hyper / valeurs.length) * 100),
    hypo: Math.round((hypo / valeurs.length) * 100),
    maximum: extremes.maximum,
    minimum: extremes.minimum,
  };
}
