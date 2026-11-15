import { obtenirTimestamp } from "./dates";
export const LIMITES_SAISIE = {
  glycemieMinMgDl: 20,
  glycemieMaxMgDl: 1_000,
  insulineMax: 500,
  noteMax: 1_000,
  descriptionMax: 1_000,
  prenomMax: 80,
} as const;

export function validerHorodatage(date: string, heure: string): { date: Date | null; erreur?: string } {
  if (!date || !heure) return { date: null, erreur: "Choisis une date et une heure." };
  const timestamp = obtenirTimestamp({ date, heure });
  const horodatage = timestamp === null ? new Date(NaN) : new Date(timestamp);
  if (!Number.isFinite(horodatage.getTime())) return { date: null, erreur: "Choisis une date et une heure valides." };
  if (horodatage.getTime() > Date.now() + 5 * 60 * 1_000) return { date: null, erreur: "La date et l’heure ne peuvent pas être dans le futur." };
  return { date: horodatage };
}

export function validerGlycemieMgDl(value: number): string | null {
  if (!Number.isFinite(value)) return "Saisis une glycémie valide.";
  if (value < LIMITES_SAISIE.glycemieMinMgDl || value > LIMITES_SAISIE.glycemieMaxMgDl) {
    return `La glycémie doit être comprise entre ${LIMITES_SAISIE.glycemieMinMgDl} et ${LIMITES_SAISIE.glycemieMaxMgDl} mg/dL.`;
  }
  return null;
}

export function validerInsuline(value: number): string | null {
  if (!Number.isFinite(value) || value < 0 || value > LIMITES_SAISIE.insulineMax) {
    return `L’insuline doit être comprise entre 0 et ${LIMITES_SAISIE.insulineMax} unités.`;
  }
  return null;
}

export function dateVersChamp(date?: string, timestamp?: string): string {
  const valeur = timestamp ? new Date(timestamp) : null;
  if (valeur && Number.isFinite(valeur.getTime())) {
    const decalage = valeur.getTimezoneOffset() * 60_000;
    return new Date(valeur.getTime() - decalage).toISOString().slice(0, 10);
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && obtenirTimestamp({date}) !== null) return date;
  const match = date?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
}
