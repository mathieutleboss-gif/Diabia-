import type { AnalyseBase } from "./types";

export function calculerScore(analyse: AnalyseBase): number | null {
  if (analyse.nombreMesures === 0) return null;

  let score = 100;
  score -= Math.max(0, 70 - analyse.cible) * 0.5;
  score -= analyse.hyper * 0.35;
  score -= analyse.hypo * 2;
  score -= (analyse.variations?.nombre || 0) * 0.25;

  if (analyse.cible >= 85) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
