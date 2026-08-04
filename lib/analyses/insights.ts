import type { AnalyseBase } from "./types";

export function genererInsights(analyse: AnalyseBase) {
  const remarques: string[] = [];

  if (analyse.cible >= 80) remarques.push("Excellent temps dans la cible sur cette période.");
  if (analyse.cible < 60) remarques.push("Le temps dans la cible reste faible.");
  if (analyse.hyper > 30) remarques.push("Les hyperglycémies représentent une part importante des mesures.");
  if (analyse.hypo > 5) remarques.push("Des hypoglycémies répétées ont été détectées.");
  if (analyse.variations?.nombre > 20) remarques.push("La glycémie est très variable au cours de la journée.");

  if (analyse.horaires?.message) remarques.push(analyse.horaires.message);
  if (analyse.tendance?.message) remarques.push(analyse.tendance.message);
  if (remarques.length === 0) remarques.push("Aucune tendance importante n'a été détectée.");

  return { titre: "Ce que Diabia remarque", remarques };
}
