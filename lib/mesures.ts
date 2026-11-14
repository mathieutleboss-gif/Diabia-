import type { Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { lireDoseInsuline } from "./insuline";

/** Même instant, glycémie, dose et note : probable réimport du même enregistrement. */
export function fusionnerMesures(actuelles: Mesure[], nouvelles: Mesure[]) {
  const cle = (m: Mesure) => {
    const temps = obtenirTimestamp(m);
    return temps === null ? null : JSON.stringify([temps, Number(m.glycemie), lireDoseInsuline(m.insuline), m.note?.trim() || ""]);
  };
  const connues = new Set(actuelles.map(cle).filter(c => c !== null));
  const resultat = [...actuelles]; let doublons = 0;
  for (const mesure of nouvelles) {
    const key = cle(mesure);
    if (key !== null && connues.has(key)) { doublons++; continue; }
    resultat.push(mesure); if (key !== null) connues.add(key);
  }
  return { mesures: resultat, ajoutees: resultat.length - actuelles.length, doublons };
}
function cellule(value: string | number | undefined) {
  const text = String(value ?? "");
  const protege = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${protege.replace(/"/g, '""')}"`;
}
export function exporterMesuresCSV(mesures: Mesure[]): string {
  const rows = mesures.map(m => {
    const temps = obtenirTimestamp(m);
    const date = temps === null ? m.date || "" : new Date(temps).toLocaleDateString("fr-FR");
    const heure = temps === null ? m.heure || "" : new Date(temps).toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit",second:"2-digit"});
    const dose = lireDoseInsuline(m.insuline);
    return [m.glycemie,date,heure,dose === null ? "" : dose,m.note].map(cellule).join(";");
  });
  return "\uFEFFglycémie;date;heure;insuline;note\r\n" + rows.join("\r\n");
}
