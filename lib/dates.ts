import type { JournalEntry, Mesure } from "./analyses/types";

type EntreeDatee = Pick<Mesure | JournalEntry, "date" | "heure" | "timestamp">;

/** Formats locaux explicites uniquement : pas de dates ambiguës interprétées par le navigateur. */
function dateLocale(annee: number, mois: number, jour: number, heure: string): number | null {
  const match = heure.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match || annee < 1000 || annee > 9999) return null;
  const h = Number(match[1]), m = Number(match[2]), sec = Number(match[3] || 0);
  const date = new Date(annee, mois - 1, jour, h, m, sec);
  return date.getFullYear() === annee && date.getMonth() === mois - 1 && date.getDate() === jour && date.getHours() === h && date.getMinutes() === m && date.getSeconds() === sec ? date.getTime() : null;
}
function timestampExplicite(value: string): number | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, sec = "0", zone] = match;
  const calendar = new Date(Date.UTC(Number(y), Number(mo)-1, Number(d)));
  if (Number(y) < 1000 || calendar.getUTCFullYear() !== Number(y) || calendar.getUTCMonth() !== Number(mo)-1 || calendar.getUTCDate() !== Number(d) || Number(h)>23 || Number(mi)>59 || Number(sec)>59) return null;
  if (zone !== "Z" && (Number(zone.slice(1,3)) > 23 || Number(zone.slice(4)) > 59)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}
export function obtenirTimestamp(entree: EntreeDatee): number | null {
  if (entree.timestamp) return timestampExplicite(entree.timestamp);
  if (!entree.date) return null;
  const valeur = entree.date.trim();
  const fr = valeur.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[T ,]+(\d{1,2}:\d{2}(?::\d{2})?))?$/);
  if (fr) return dateLocale(Number(fr[3]), Number(fr[2]), Number(fr[1]), entree.heure?.trim() || fr[4] || "00:00");
  const iso = valeur.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}:\d{2}(?::\d{2})?))?$/);
  if (iso) return dateLocale(Number(iso[1]), Number(iso[2]), Number(iso[3]), entree.heure?.trim() || iso[4] || "00:00");
  return timestampExplicite(valeur);
}

export function trierMesuresChronologiquement(mesures: Mesure[]): Mesure[] {
  const mesuresDatees = mesures.map((mesure, index) => ({
    mesure,
    index,
    timestamp: obtenirTimestamp(mesure),
  }));

  return mesuresDatees
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) return a.index - b.index;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return a.timestamp - b.timestamp || a.index - b.index;
    })
    .map(({ mesure }) => mesure);
}

export function sontDuMemeJour(a: EntreeDatee, b: EntreeDatee): boolean | null {
  const timestampA = obtenirTimestamp(a);
  const timestampB = obtenirTimestamp(b);
  if (timestampA === null || timestampB === null) return null;

  const dateA = new Date(timestampA);
  const dateB = new Date(timestampB);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
