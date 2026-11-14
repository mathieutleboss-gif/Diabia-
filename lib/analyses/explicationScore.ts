import type { AnalyseBase } from "./types";

export function expliquerScore(analyse: AnalyseBase, score: number | null) {
  if (score === null) {
    return {
      score,
      positif: [],
      problemes: [],
      conseils: ["Ajoute au moins une mesure valide pour calculer le score Diabia."],
    };
  }

  const positif: string[] = [];
  const problemes: string[] = [];
  const remarques: string[] = [];

  if (analyse.nombreMesures < 5) {
    return {
      score,
      positif: [],
      problemes: ["Échantillon insuffisant pour évaluer un équilibre glycémique."],
      conseils: ["Ajoute au moins cinq mesures datées, réparties sur plusieurs jours, avant d’interpréter le score."],
    };
  }

  if (analyse.cible >= 80) {
    positif.push(`${analyse.cible}% des mesures sont dans la zone de référence. Ce pourcentage ne mesure pas à lui seul la stabilité.`);
  } else if (analyse.cible >= 50) {
    positif.push(
      `${analyse.cible}% des mesures sont dans la cible sur l’échantillon disponible.`
    );
  } else {
    positif.push(
      "Les données permettent à Diabia d'identifier les périodes qui peuvent être améliorées."
    );
  }

  if (analyse.hypo <= 5) {
    positif.push("Peu de périodes d'hypoglycémie détectées.");
  }

  if (analyse.cible < 70) {
    problemes.push("Moins de 70% des mesures sont dans la zone de référence ; ce pourcentage ne représente pas un temps passé dans cette zone.");
  }
  if (analyse.hyper > 20) {
    problemes.push(`${analyse.hyper}% des mesures sont au-dessus de la cible.`);
  }
  if (analyse.hypo > 5) {
    problemes.push(`${analyse.hypo}% des mesures sont en dessous de la cible.`);
  }
  if (analyse.variations.nombre > 10) {
    problemes.push("Diabia détecte beaucoup de changements importants de glycémie.");
  } else if (analyse.variations.nombre > 0) {
    problemes.push("Quelques variations importantes ont été détectées.");
  }

  if (analyse.hyper > analyse.hypo) {
    remarques.push(
      "La principale marge d'amélioration concerne les périodes où la glycémie reste trop élevée."
    );
  }
  if (analyse.variations.nombre > 10) {
    remarques.push("Les courbes seraient plus stables avec moins de grandes montées et descentes.");
  }
  if (analyse.cible < 50) {
    remarques.push(
      "Diabia conseille de se concentrer d'abord sur les grandes variations plutôt que sur les petits écarts."
    );
  } else if (analyse.cible >= 70) {
    remarques.push("L’échantillon observé est encourageant ; la régularité reste à confirmer dans le temps.");
  }

  return { score, positif, problemes, conseils: remarques };
}
