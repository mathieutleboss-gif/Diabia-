import { sauvegardeValide } from "./sauvegarde";
import type { InjectionInsuline, JournalEntry, Mesure, ProfilDiabia } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { STORAGE_KEYS, STORAGE_VERSION } from "./storageKeys";
import { normaliserInjections, normaliserJournal, normaliserMesures, normaliserProfil } from "./validation";

let espace: string | null = null;
export function activerEspaceCompte(id: string | null) { espace = id === null ? "invite" : `compte:${encodeURIComponent(id)}`; }
function stockage() {
  const key = (cle: string) => espace === null ? cle : `diabia:${espace}:${cle}`;
  return { getItem: (cle: string) => localStorage.getItem(key(cle)), setItem: (cle: string,value: string) => localStorage.setItem(key(cle),value), removeItem: (cle: string) => localStorage.removeItem(key(cle)) };
}
export function sauvegardeHistoriqueNavigateur() {
  const lire = (key: string, fallback: string) => JSON.parse(localStorage.getItem(key) || fallback) as unknown;
  const value = { version: 2, mesures: lire(STORAGE_KEYS.mesures,"[]"),journal:lire(STORAGE_KEYS.journal,"[]"),profil:lire(STORAGE_KEYS.profil,"{}"),injections:lire(STORAGE_KEYS.injections,"[]") };
  if (!sauvegardeValide(value)) throw new Error("Ancien historique invalide");
  return value;
}
export function lireInjectionsLocales(): InjectionInsuline[] { return normaliserInjections(lireJsonLocal(STORAGE_KEYS.injections,[])); }

function lireJsonLocal(key: string, fallback: unknown): unknown {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(stockage().getItem(key) || JSON.stringify(fallback)) as unknown;
  } catch {
    return fallback;
  }
}

export function lireValeurLocale(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try { return stockage().getItem(key) || fallback; } catch { return fallback; }
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
    if ([STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil, STORAGE_KEYS.injections].some(cle => cle === key)) {
      const raw = stockage().getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        const partie = (value: unknown) => ({version: STORAGE_VERSION, mesures: [], journal: [], injections: [], profil: {}, [key === STORAGE_KEYS.mesures ? "mesures" : key === STORAGE_KEYS.journal ? "journal" : key === STORAGE_KEYS.injections ? "injections" : "profil"]: value});
        if (!sauvegardeValide(partie(parsed))) return false;
      }
    }
    if ([STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil, STORAGE_KEYS.injections].some(cle => cle === key)) {
      const nom = key === STORAGE_KEYS.mesures ? "mesures" : key === STORAGE_KEYS.journal ? "journal" : key === STORAGE_KEYS.injections ? "injections" : "profil";
      if (!sauvegardeValide({version: STORAGE_VERSION, mesures: [], journal: [], injections: [], profil: {}, [nom]: value})) return false;
    }
    stockage().setItem(key, JSON.stringify(value));
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
    const version = Number(stockage().getItem(STORAGE_KEYS.version) || 0);
    if (version >= STORAGE_VERSION) return true;
    const mesures = migrerEntreesDatees(lireJsonLocal(STORAGE_KEYS.mesures, null));
    const journal = migrerEntreesDatees(lireJsonLocal(STORAGE_KEYS.journal, null));

    if (mesures !== null && stockage().getItem(STORAGE_KEYS.mesures) !== null) {
      stockage().setItem(STORAGE_KEYS.mesures, JSON.stringify(mesures));
    }
    if (journal !== null && stockage().getItem(STORAGE_KEYS.journal) !== null) {
      stockage().setItem(STORAGE_KEYS.journal, JSON.stringify(journal));
    }
    stockage().setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
    return true;
  } catch {
    return false;
  }
}

export function exporterDonneesLocales() {
  if (typeof window === "undefined") throw new Error("Le stockage local n’est pas accessible.");
  const lire = (key: string, fallback: string) => JSON.parse(stockage().getItem(key) || fallback) as unknown;
  const donnees = { version: STORAGE_VERSION, exporteLe: new Date().toISOString(), injections: lire(STORAGE_KEYS.injections,"[]"), mesures: lire(STORAGE_KEYS.mesures,"[]"), journal: lire(STORAGE_KEYS.journal,"[]"), profil: lire(STORAGE_KEYS.profil,"{}") };
  if (!sauvegardeValide(donnees)) throw new Error("Les données locales doivent être vérifiées avant de générer une sauvegarde restaurable.");
  return { ...donnees, injections: normaliserInjections(donnees.injections), mesures: normaliserMesures(donnees.mesures), journal: normaliserJournal(donnees.journal), profil: normaliserProfil(donnees.profil) };
}

export function supprimerDonneesLocales(): boolean {
  if (typeof window === "undefined") return false;
  const cles = [STORAGE_KEYS.injections, STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil, STORAGE_KEYS.version, "diabia_sync_meta"];
  try {
    const avant = cles.map(cle => [cle, stockage().getItem(cle)] as const);
    try { for (const cle of cles) stockage().removeItem(cle); }
    catch {
      for (const [cle, valeur] of avant) {
        try { if (valeur === null) stockage().removeItem(cle); else stockage().setItem(cle, valeur); }
        catch { /* Le navigateur peut aussi empêcher le retour arrière : échec signalé. */ }
      }
      return false;
    }
    window.dispatchEvent(new CustomEvent("diabia:storage", {detail:{action:"clear-local"}}));
    return true;
  } catch { return false; }
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
    const injections = uniques(normaliserInjections(value.injections));
    const profil = normaliserProfil(value.profil);
    const sauvegarde = {
      injections: stockage().getItem(STORAGE_KEYS.injections), mesures: stockage().getItem(STORAGE_KEYS.mesures), journal: stockage().getItem(STORAGE_KEYS.journal),
      profil: stockage().getItem(STORAGE_KEYS.profil), version: stockage().getItem(STORAGE_KEYS.version),
    };
    try {
      stockage().setItem(STORAGE_KEYS.injections, JSON.stringify(injections));
      stockage().setItem(STORAGE_KEYS.mesures, JSON.stringify(mesures));
      stockage().setItem(STORAGE_KEYS.journal, JSON.stringify(journal));
      stockage().setItem(STORAGE_KEYS.profil, JSON.stringify(profil));
      stockage().setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
      window.dispatchEvent(new Event("diabia:storage"));
      return true;
    } catch {
      Object.entries(sauvegarde).forEach(([nom, contenu]) => {
        const cle = STORAGE_KEYS[nom as keyof typeof STORAGE_KEYS];
        try { if (contenu === null) stockage().removeItem(cle); else stockage().setItem(cle, contenu); }
        catch { /* Aucun crash si les permissions du stockage ont changé. */ }
      });
      return false;
    }
  } catch { return false; }
}

export function verifierStockage(): "ok" | "bloque" | "corrompu" {
  if (typeof window === "undefined") return "ok";
  try {
    for (const key of [STORAGE_KEYS.mesures, STORAGE_KEYS.journal, STORAGE_KEYS.profil, STORAGE_KEYS.injections]) {
      const raw = stockage().getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (key === STORAGE_KEYS.profil ? !parsed || typeof parsed !== "object" || Array.isArray(parsed) : !Array.isArray(parsed)) return "corrompu";
        } catch { return "corrompu"; }
      }
    }
    const snapshot = {
      version: STORAGE_VERSION,
      mesures: JSON.parse(stockage().getItem(STORAGE_KEYS.mesures) || "[]"),
      journal: JSON.parse(stockage().getItem(STORAGE_KEYS.journal) || "[]"),
      injections: JSON.parse(stockage().getItem(STORAGE_KEYS.injections) || "[]"),
      profil: JSON.parse(stockage().getItem(STORAGE_KEYS.profil) || "{}"),
    };
    if (!sauvegardeValide(snapshot)) return "corrompu";
    const key = "diabia_storage_probe";
    stockage().setItem(key,"1"); stockage().removeItem(key);
    return "ok";
  } catch { return "bloque"; }
}

export function espaceCompteActif(id: string): boolean { return espace === `compte:${encodeURIComponent(id)}`; }
