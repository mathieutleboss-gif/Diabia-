import type { InjectionInsuline, JournalEntry, Mesure, ProfilDiabia } from "./analyses/types";
import { estUniteGlycemie } from "./glucoseUnits";

function estObjet(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function chaineOptionnelle(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function normaliserMesures(value: unknown): Mesure[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!estObjet(item)) return [];
    if (typeof item.glycemie !== "string" && typeof item.glycemie !== "number") return [];
    if (typeof item.glycemie === "string" && !item.glycemie.trim()) return [];

    return [{
      id: chaineOptionnelle(item.id),
      glycemie: item.glycemie,
      insuline:
        typeof item.insuline === "string" || typeof item.insuline === "number"
          ? item.insuline
          : undefined,
      date: chaineOptionnelle(item.date),
      heure: chaineOptionnelle(item.heure),
      timestamp: chaineOptionnelle(item.timestamp),
      note: chaineOptionnelle(item.note),
    }];
  });
}

export function normaliserJournal(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!estObjet(item)) return [];
    return [{
      id: chaineOptionnelle(item.id),
      type: chaineOptionnelle(item.type),
      description: chaineOptionnelle(item.description),
      heure: chaineOptionnelle(item.heure),
      date: chaineOptionnelle(item.date),
      timestamp: chaineOptionnelle(item.timestamp),
    }];
  });
}

export function normaliserProfil(value: unknown): ProfilDiabia {
  if (!estObjet(value)) return {};
  return {
    prenom: chaineOptionnelle(value.prenom),
    diabete: chaineOptionnelle(value.diabete),
    appareil: chaineOptionnelle(value.appareil),
    objectif: chaineOptionnelle(value.objectif),
    uniteGlycemie: estUniteGlycemie(value.uniteGlycemie) ? value.uniteGlycemie : undefined,
  };
}

export function normaliserInjections(value: unknown): InjectionInsuline[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => {
    if (!estObjet(row) || typeof row.id !== "string" || typeof row.dose !== "number" || !Number.isFinite(row.dose) || row.dose < 0 || row.dose > 500 || typeof row.timestamp !== "string" || typeof row.date !== "string") return [];
    return [{id:row.id,dose:row.dose,date:row.date,timestamp:row.timestamp,heure:chaineOptionnelle(row.heure),note:chaineOptionnelle(row.note),type:row.type === "rapide" || row.type === "basale" ? row.type : "non_precise",source:row.source === "csv" ? "csv" : "manuel"}];
  });
}
