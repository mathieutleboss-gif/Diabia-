import { obtenirTimestamp } from "./dates";
import { LIMITES_SAISIE, validerGlycemieMgDl, validerInsuline } from "./saisie";
import { STORAGE_VERSION } from "./storageKeys";
function objet(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function chaine(value: unknown, max: number) { return value === undefined || typeof value === "string" && value.length <= max; }
/** Refus intégral d'un fichier invalide : aucune restauration partielle silencieuse. */
export function sauvegardeValide(value: unknown): value is Record<string, unknown> & { mesures: unknown[]; journal: unknown[]; profil: Record<string, unknown> } {
  if (!objet(value) || value.version !== undefined && (!Number.isInteger(value.version) || Number(value.version) < 1 || Number(value.version) > STORAGE_VERSION)) return false;
  if (!Array.isArray(value.mesures) || !Array.isArray(value.journal) || !objet(value.profil)) return false;
  const dateValide = (row: Record<string, unknown>) => {
    if (!chaine(row.date,100) || !chaine(row.heure,20) || !chaine(row.timestamp,100)) return false;
    return !(row.date || row.timestamp) || obtenirTimestamp({ date: row.date as string, heure: row.heure as string, timestamp: row.timestamp as string }) !== null;
  };
  const nombre = (v: unknown) => (typeof v === "number" || typeof v === "string" && /^\d+(?:[.,]\d+)?$/.test(v.trim())) ? Number(String(v).replace(",", ".")) : NaN;
  for (const row of value.mesures) {
    if (!objet(row) || validerGlycemieMgDl(nombre(row.glycemie)) || !dateValide(row) || !chaine(row.id,200) || !chaine(row.note,LIMITES_SAISIE.noteMax)) return false;
    if (row.insuline !== undefined && row.insuline !== "" && validerInsuline(nombre(row.insuline))) return false;
  }
  if (value.injections !== undefined) {
    if (!Array.isArray(value.injections)) return false;
    for (const row of value.injections) {
      if (!objet(row) || typeof row.dose !== "number" || validerInsuline(row.dose) || !chaine(row.id,200) || typeof row.timestamp !== "string" || !row.timestamp || typeof row.date !== "string" || !dateValide(row) || !chaine(row.note,LIMITES_SAISIE.noteMax)) return false;
      if (row.type !== undefined && !["non_precise","rapide","basale"].includes(String(row.type))) return false;
    }
  }
  for (const row of value.journal) {
    if (!objet(row) || !chaine(row.id,200) || !chaine(row.type,100) || !chaine(row.description,LIMITES_SAISIE.descriptionMax) || !dateValide(row)) return false;
  }
  const profil = value.profil;
  for (const key of ["prenom","diabete","appareil","objectif","uniteGlycemie"]) if (!chaine(profil[key],key === "prenom" ? LIMITES_SAISIE.prenomMax : 200)) return false;
  if (profil.uniteGlycemie !== undefined && !["mg/dL","g/L","mmol/L"].includes(String(profil.uniteGlycemie))) return false;
  return true;
}
