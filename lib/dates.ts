import type { JournalEntry, Mesure } from "./analyses/types";

type EntreeDatee = Pick<Mesure | JournalEntry, "date" | "heure" | "timestamp">;

const DATE_FRANCAISE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

export function obtenirTimestamp(entree: EntreeDatee): number | null {
  if (entree.timestamp) {
    const timestamp = Date.parse(entree.timestamp);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  if (!entree.date) return null;

  const correspondance = entree.date.match(DATE_FRANCAISE);
  if (correspondance) {
    const [, jour, mois, annee, heureDate, minuteDate, secondeDate] = correspondance;
    const [heureEntree = "0", minuteEntree = "0"] = (entree.heure || "").split(":");
    const date = new Date(
      Number(annee),
      Number(mois) - 1,
      Number(jour),
      Number(heureDate ?? heureEntree),
      Number(minuteDate ?? minuteEntree),
      Number(secondeDate ?? 0)
    );
    if (
      date.getFullYear() !== Number(annee) ||
      date.getMonth() !== Number(mois) - 1 ||
      date.getDate() !== Number(jour) ||
      date.getHours() !== Number(heureDate ?? heureEntree) ||
      date.getMinutes() !== Number(minuteDate ?? minuteEntree)
    ) {
      return null;
    }
    const timestamp = date.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  const timestamp = Date.parse(entree.date);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function trierMesuresChronologiquement(mesures: Mesure[]): Mesure[] {
  const mesuresDatees = mesures.map((mesure, index) => ({
    mesure,
    index,
    timestamp: obtenirTimestamp(mesure),
  }));

  if (mesuresDatees.some(({ timestamp }) => timestamp === null)) return mesures;

  return mesuresDatees
    .sort((a, b) => (a.timestamp as number) - (b.timestamp as number) || a.index - b.index)
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
