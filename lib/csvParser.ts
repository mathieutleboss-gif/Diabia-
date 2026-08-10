import type { Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { convertirEnMgDl, type GlucoseUnit } from "./glucoseUnits";
import { LIMITES_SAISIE, validerGlycemieMgDl, validerInsuline } from "./saisie";

type CsvRow = Record<string, unknown>;

export type CsvParseResult = {
  mesures: Mesure[];
  lignesRejetees: number;
  colonnesDetectees: string[];
  rejets: Array<{ ligne: number; raison: string }>;
};

const aliases = {
  glycemie: ["glycemie", "glucose", "sg"],
  insuline: ["insuline", "insulin"],
  date: ["date"],
  heure: ["heure", "time"],
  note: ["note", "commentaire", "comment"],
} as const;

function normaliserCle(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function normaliserLigne(ligne: CsvRow): CsvRow {
  return Object.fromEntries(Object.entries(ligne).map(([key, value]) => [normaliserCle(key), value]));
}

function lireChamp(ligne: CsvRow, noms: readonly string[]): unknown {
  for (const nom of noms) {
    const valeur = ligne[nom];
    if (valeur !== undefined && valeur !== null && String(valeur).trim() !== "") return valeur;
  }
  return undefined;
}

function lireNombre(value: unknown): number {
  return Number(String(value ?? "").trim().replace(",", "."));
}

export function analyserCSVDetaille(
  lignes: CsvRow[],
  unite: GlucoseUnit = "mg/dL"
): CsvParseResult {
  const colonnesDetectees = Array.from(new Set(lignes.flatMap((ligne) => Object.keys(ligne))));
  let lignesRejetees = 0;
  const mesures: Mesure[] = [];
  const rejets: Array<{ ligne: number; raison: string }> = [];

  lignes.forEach((ligneBrute, index) => {
    const ligne = normaliserLigne(ligneBrute);
    const glycemieBrute = lireChamp(ligne, aliases.glycemie);
    const dateBrute = lireChamp(ligne, aliases.date);
    const heureBrute = lireChamp(ligne, aliases.heure);
    const valeurGlycemie = convertirEnMgDl(lireNombre(glycemieBrute), unite);

    const erreurGlycemie = validerGlycemieMgDl(valeurGlycemie);
    if (erreurGlycemie || !dateBrute) {
      lignesRejetees += 1;
      rejets.push({ ligne: index + 2, raison: erreurGlycemie || "Date obligatoire manquante." });
      return;
    }

    const date = String(dateBrute).trim();
    const heure = heureBrute ? String(heureBrute).trim() : undefined;
    const timestamp = obtenirTimestamp({ date, heure });
    if (timestamp === null) {
      lignesRejetees += 1;
      rejets.push({ ligne: index + 2, raison: "Date ou heure invalide." });
      return;
    }
    if (timestamp > Date.now() + 5 * 60 * 1_000) {
      lignesRejetees += 1;
      rejets.push({ ligne: index + 2, raison: "Date située dans le futur." });
      return;
    }

    const insulineBrute = lireChamp(ligne, aliases.insuline);
    const valeurInsuline = lireNombre(insulineBrute);
    const noteBrute = lireChamp(ligne, aliases.note);
    const insuline = Number.isFinite(valeurInsuline) ? valeurInsuline : 0;
    const erreurInsuline = validerInsuline(insuline);
    if (erreurInsuline) {
      lignesRejetees += 1;
      rejets.push({ ligne: index + 2, raison: erreurInsuline });
      return;
    }
    mesures.push({
      id: crypto.randomUUID(),
      glycemie: valeurGlycemie,
      insuline,
      date,
      ...(heure ? { heure } : {}),
      timestamp: new Date(timestamp).toISOString(),
      note: noteBrute ? String(noteBrute).trim().slice(0, LIMITES_SAISIE.noteMax) : "Import CSV",
    });
  });

  return { mesures, lignesRejetees, colonnesDetectees, rejets };
}

export function analyserCSV(lignes: CsvRow[], unite: GlucoseUnit = "mg/dL"): Mesure[] {
  return analyserCSVDetaille(lignes, unite).mesures;
}
