import type { Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";

type CsvRow = Record<string, unknown>;

export function analyserCSV(lignes: CsvRow[]): Mesure[] {

  return lignes.flatMap((ligne) => {

    const glycemie =
      ligne.glycemie ||
      ligne.glucose ||
      ligne.Glucose ||
      ligne.sg ||
      ligne.SG ||
      0;


    const insuline =
      ligne.insuline ||
      ligne.Insuline ||
      ligne.insulin ||
      0;


    const dateBrute =
      ligne.date ||
      ligne.Date ||
      new Date().toLocaleDateString();

    const valeurGlycemie = Number(glycemie);
    if (!glycemie || !Number.isFinite(valeurGlycemie) || valeurGlycemie <= 0) return [];
    const valeurInsuline = Number(insuline);

    const date = String(dateBrute);
    const timestamp = obtenirTimestamp({ date });

    return [{

      glycemie: valeurGlycemie,

      insuline: Number.isFinite(valeurInsuline) && valeurInsuline >= 0 ? valeurInsuline : 0,

      date,

      ...(timestamp !== null ? { timestamp: new Date(timestamp).toISOString() } : {}),

      note: "Import CSV"

    }];

  });

}
