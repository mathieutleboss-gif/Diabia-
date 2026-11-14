import { sauvegardeValide } from "./sauvegarde";
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
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
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

export function sauvegarderLocal(key: string, value: unknown, options: { notifier?: boolean } = {}): boolean {
  if (typeof window === "undefined") return false;

  try {
    if ([STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil].some(cle => cle === key)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (key === STORAGE_KEYS.profil ? !parsed || typeof parsed !== "object" || Array.isArray(parsed) : !Array.isArray(parsed)) return false;
      }
    }
    localStorage.setItem(key, JSON.stringify(value));
    if (options.notifier !== false) window.dispatchEvent(new Event("diabia:storage"));
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
  try {
    const version = Number(localStorage.getItem(STORAGE_KEYS.version) || 0);
    if (version >= STORAGE_VERSION) return true;
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
  if (typeof window === "undefined") throw new Error("Le stockage local n’est pas accessible.");
  const lire = (key: string, fallback: string) => JSON.parse(localStorage.getItem(key) || fallback) as unknown;
  const donnees = { version: STORAGE_VERSION, exporteLe: new Date().toISOString(), mesures: lire(STORAGE_KEYS.mesures,"[]"), journal: lire(STORAGE_KEYS.journal,"[]"), profil: lire(STORAGE_KEYS.profil,"{}") };
  if (!sauvegardeValide(donnees)) throw new Error("Les données locales doivent être vérifiées avant de générer une sauvegarde restaurable.");
  return { ...donnees, mesures: normaliserMesures(donnees.mesures), journal: normaliserJournal(donnees.journal), profil: normaliserProfil(donnees.profil) };
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

export function restaurerDonneesLocales(value: unknown): boolean {
  if (typeof window === "undefined" || !sauvegardeValide(value)) return false;
  const uniques = <T extends {id?: string}>(rows: T[]): T[] => {
    const ids = new Set<string>();
    return rows.map(row => {
      const id = row.id && !ids.has(row.id) ? row.id : crypto.randomUUID();
      ids.add(id); return {...row,id};
    });
  };
  try {
    const mesures = uniques(normaliserMesures(value.mesures)).map(m => ({...m, glycemie: Number(String(m.glycemie).replace(",", "."))}));
    const journal = uniques(normaliserJournal(value.journal));
    const profil = normaliserProfil(value.profil);
    const sauvegarde = {
      mesures: localStorage.getItem(STORAGE_KEYS.mesures), journal: localStorage.getItem(STORAGE_KEYS.journal),
      profil: localStorage.getItem(STORAGE_KEYS.profil), version: localStorage.getItem(STORAGE_KEYS.version),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.mesures, JSON.stringify(mesures));
      localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(journal));
      localStorage.setItem(STORAGE_KEYS.profil, JSON.stringify(profil));
      localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
      window.dispatchEvent(new Event("diabia:storage"));
      return true;
    } catch {
      Object.entries(sauvegarde).forEach(([nom, contenu]) => {
        const cle = STORAGE_KEYS[nom as keyof typeof STORAGE_KEYS];
        try { if (contenu === null) localStorage.removeItem(cle); else localStorage.setItem(cle, contenu); }
        catch { /* Aucun crash si les permissions du stockage ont changé. */ }
      });
      return false;
    }
  } catch { return false; }
}

export function verifierStockage(): "ok" | "bloque" | "corrompu" {
  if (typeof window === "undefined") return "ok";
  try {
    for (const key of [STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil]) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (key === STORAGE_KEYS.profil ? !parsed || typeof parsed !== "object" || Array.isArray(parsed) : !Array.isArray(parsed)) return "corrompu";
        } catch { return "corrompu"; }
      }
    }
    const key = "diabia_storage_probe";
    localStorage.setItem(key,"1"); localStorage.removeItem(key);
    return "ok";
  } catch { return "bloque"; }
}
