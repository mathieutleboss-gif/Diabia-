import type { Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { LIMITES_SAISIE } from "./saisie";

/** Une absence d'information n'est jamais une dose de zéro. */
export function lireDoseInsuline(value: Mesure["insuline"]): number | null {
  if (value === undefined || typeof value === "string" && !value.trim()) return null;
  const dose = typeof value === "string" ? Number(value.trim().replace(",", ".")) : value;
  return Number.isFinite(dose) && dose >= 0 && dose <= LIMITES_SAISIE.insulineMax ? dose : null;
}
export function formaterDose(dose: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(dose);
}
export function resumerInsuline(mesures: Mesure[]) {
  const renseignees = mesures.flatMap(mesure => {
    const dose = lireDoseInsuline(mesure.insuline);
    return dose === null ? [] : [{ ...mesure, dose, temps: obtenirTimestamp(mesure) }];
  });
  const injections = renseignees.filter(mesure => mesure.dose > 0).sort((a,b) => (b.temps ?? -Infinity) - (a.temps ?? -Infinity));
  const jours = new Map<string, { cle: string; label: string; total: number; saisies: number }>();
  for (const mesure of renseignees) {
    if (mesure.temps === null) continue;
    const date = new Date(mesure.temps);
    const cle = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const jour = jours.get(cle) || { cle, label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date), total: 0, saisies: 0 };
    jour.total += mesure.dose; jour.saisies++;
    jours.set(cle, jour);
  }
  return { total: renseignees.reduce((sum,mesure) => sum + mesure.dose,0), renseignees: renseignees.length, manquantes: mesures.length-renseignees.length, injections, jours: [...jours.values()].sort((a,b) => a.cle.localeCompare(b.cle)) };
}
