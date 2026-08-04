export function calculerScore(analyse: any): number {

  let score = 100;

  // Temps dans la cible
  score -= Math.max(0, 70 - analyse.cible) * 0.5;

  // Hyperglycémies
  score -= analyse.hyper * 0.35;

  // Hypoglycémies (plus pénalisées)
  score -= analyse.hypo * 2;

  // Variabilité
  score -= (analyse.variations?.nombre || 0) * 0.25;

  // Bonus si très bon temps dans la cible
  if (analyse.cible >= 85) {
    score += 5;
  }

  // Plafond
  score = Math.max(0, Math.min(100, Math.round(score)));

  return score;
}