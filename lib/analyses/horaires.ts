import type { Mesure } from "./types";

export function analyserHoraires(mesures: Mesure[]) {
  if (mesures.length === 0) {
    return { message: "Pas assez de données." };
  }

  let matin = 0;
  let midi = 0;
  let soir = 0;
  let nuit = 0;

  mesures.forEach((mesure) => {
    if (Number(mesure.glycemie) <= 180 || !mesure.heure) return;

    const heure = Number(mesure.heure.split(":")[0]);
    if (heure >= 6 && heure < 12) matin += 1;
    else if (heure >= 12 && heure < 18) midi += 1;
    else if (heure >= 18 && heure < 24) soir += 1;
    else nuit += 1;
  });

  const periodes = [
    { nom: "matin", valeur: matin },
    { nom: "midi", valeur: midi },
    { nom: "soir", valeur: soir },
    { nom: "nuit", valeur: nuit },
  ].sort((a, b) => b.valeur - a.valeur);
  const principale = periodes[0];
  const message = principale.valeur > 0
    ? `Les mesures supérieures à 180 mg/dL apparaissent principalement le ${principale.nom} (${principale.valeur} mesure(s)).`
    : "Aucune période problématique détectée.";

  return { matin, midi, soir, nuit, message };
}
