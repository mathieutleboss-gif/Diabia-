import type { JournalEntry, Mesure, ProfilDiabia } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { STORAGE_KEYS, STORAGE_VERSION } from "./storageKeys";
import { normaliserJournal, normaliserMesures, normaliserProfil } from "./validation";

function lireJsonLocal(key: string, fallback: unknown): unknown {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as unknown;
  } catch {
    return fallback;
  }
}

export function lireValeurLocale(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

export function lireMesuresLocales(): Mesure[] {
  return normaliserMesures(lireJsonLocal(STORAGE_KEYS.mesures, []));
}

export function lireJournalLocal(): JournalEntry[] {
  return normaliserJournal(lireJsonLocal(STORAGE_KEYS.journal, []));
}

export function lireProfilLocal(): ProfilDiabia {
  return normaliserProfil(lireJsonLocal(STORAGE_KEYS.profil, {}));
}

export function sauvegarderLocal(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("diabia:storage"));
    return true;
  } catch {
    return false;
  }
}

function migrerEntreesDatees(value: unknown): unknown[] | null {
  if (!Array.isArray(value)) return null;

  return value.map((entree) => {
    if (!entree || typeof entree !== "object" || Array.isArray(entree)) return entree;
    const objet = entree as Record<string, unknown>;
    const timestamp = obtenirTimestamp({
      date: typeof objet.date === "string" ? objet.date : undefined,
      heure: typeof objet.heure === "string" ? objet.heure : undefined,
    });
    return {
      ...objet,
      ...(typeof objet.id === "string" && objet.id ? {} : { id: crypto.randomUUID() }),
      ...(typeof objet.timestamp === "string" || timestamp === null
        ? {}
        : { timestamp: new Date(timestamp).toISOString() }),
    };
  });
}

export function migrerStockageLocal(): boolean {
  if (typeof window === "undefined") return false;
  const version = Number(localStorage.getItem(STORAGE_KEYS.version) || 0);
  if (version >= STORAGE_VERSION) return true;

  try {
    const mesures = migrerEntreesDatees(lireJsonLocal(STORAGE_KEYS.mesures, null));
    const journal = migrerEntreesDatees(lireJsonLocal(STORAGE_KEYS.journal, null));

    if (mesures !== null && localStorage.getItem(STORAGE_KEYS.mesures) !== null) {
      localStorage.setItem(STORAGE_KEYS.mesures, JSON.stringify(mesures));
    }
    if (journal !== null && localStorage.getItem(STORAGE_KEYS.journal) !== null) {
      localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(journal));
    }
    localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
    return true;
  } catch {
    return false;
  }
}

export function exporterDonneesLocales() {
  return {
    version: STORAGE_VERSION,
    exporteLe: new Date().toISOString(),
    mesures: lireMesuresLocales(),
    journal: lireJournalLocal(),
    profil: lireProfilLocal(),
  };
}

export function supprimerDonneesLocales(): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.removeItem(STORAGE_KEYS.mesures);
    localStorage.removeItem(STORAGE_KEYS.journal);
    localStorage.removeItem(STORAGE_KEYS.profil);
    localStorage.removeItem(STORAGE_KEYS.version);
    window.dispatchEvent(new Event("diabia:storage"));
    return true;
  } catch {
    return false;
  }
}
