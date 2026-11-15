import { obtenirTimestamp } from "../dates";
import type {
  AlerteSecurite,
  ComparaisonPeriode,
  ConclusionAnalyse,
  CorrelationJournal,
  JournalEntry,
  Mesure,
  NiveauConfiance,
  QualiteDonnees,
  RapportAnalyseAvancee,
  StatistiquesPeriode,
} from "./types";

const JOUR = 24 * 60 * 60 * 1_000;
const PERIODES = [
  { cle: "7j", libelle: "7 derniers jours", jours: 7 },
  { cle: "14j", libelle: "14 derniers jours", jours: 14 },
  { cle: "30j", libelle: "30 derniers jours", jours: 30 },
] as const;

type MesureDatee = Mesure & { valeur: number; temps: number };

function arrondir(value: number, decimales = 0): number {
  const facteur = 10 ** decimales;
  return Math.round(value * facteur) / facteur;
}

function mesuresValides(mesures: Mesure[]): Mesure[] {
  return mesures.filter((mesure) => {
    const valeur = Number(mesure.glycemie);
    return Number.isFinite(valeur) && valeur > 0;
  });
}

function mesuresDatees(mesures: Mesure[]): MesureDatee[] {
  return mesures.flatMap((mesure) => {
    const temps = obtenirTimestamp(mesure);
    const valeur = Number(mesure.glycemie);
    return temps === null || !Number.isFinite(valeur) ? [] : [{ ...mesure, valeur, temps }];
  }).sort((a, b) => a.temps - b.temps);
}

function joursDistincts(mesures: MesureDatee[]): number {
  return new Set(mesures.map(({ temps }) => {
    const date = new Date(temps);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  })).size;
}

function niveauConfiance(nombreMesures: number, jours: number, couverture = 100): NiveauConfiance {
  if (((nombreMesures >= 70 && jours >= 7) || (nombreMesures >= 30 && jours >= 14)) && couverture >= 80) return "élevé";
  if (nombreMesures >= 10 && jours >= 3 && couverture >= 60) return "modéré";
  return "faible";
}

function justificationConfiance(niveau: NiveauConfiance, nombre: number, jours: number): string {
  if (niveau === "élevé") return `${nombre} mesures réparties sur ${jours} jours soutiennent cette conclusion.`;
  if (niveau === "modéré") return `${nombre} mesures sur ${jours} jours montrent un signal utile, encore à confirmer.`;
  return `Conclusion exploratoire : seulement ${nombre} mesures sur ${jours} jour${jours > 1 ? "s" : ""}.`;
}

function statistiques(
  cle: StatistiquesPeriode["cle"],
  libelle: string,
  echantillon: MesureDatee[]
): StatistiquesPeriode {
  const valeurs = echantillon.map(({ valeur }) => valeur);
  const nombre = valeurs.length;
  const jours = joursDistincts(echantillon);
  if (!nombre) {
    return {
      cle, libelle, nombreMesures: 0, mesuresDatees: 0, joursCouverts: 0,
      moyenne: null, minimum: null, maximum: null, cible: null, hyper: null,
      hypo: null, hyperSevere: null, hypoNiveau2: null, coefficientVariation: null,
      confiance: "faible",
    };
  }
  const moyenne = valeurs.reduce((somme, valeur) => somme + valeur, 0) / nombre;
  const variance = valeurs.reduce((somme, valeur) => somme + (valeur - moyenne) ** 2, 0) / nombre;
  const pourcentage = (predicate: (value: number) => boolean) =>
    arrondir((valeurs.filter(predicate).length / nombre) * 100);
  return {
    cle,
    libelle,
    nombreMesures: nombre,
    mesuresDatees: nombre,
    joursCouverts: jours,
    moyenne: arrondir(moyenne),
    minimum: valeurs.reduce((min,value)=>Math.min(min,value),Infinity),
    maximum: valeurs.reduce((max,value)=>Math.max(max,value),-Infinity),
    cible: pourcentage((value) => value >= 70 && value <= 180),
    hyper: pourcentage((value) => value > 180),
    hypo: pourcentage((value) => value < 70),
    hyperSevere: pourcentage((value) => value > 250),
    hypoNiveau2: pourcentage((value) => value < 54),
    coefficientVariation: moyenne > 0 ? arrondir((Math.sqrt(variance) / moyenne) * 100, 1) : null,
    confiance: niveauConfiance(nombre, jours),
  };
}

function creerConclusion(
  id: string,
  titre: string,
  conclusion: string,
  preuves: string[],
  confiance: NiveauConfiance,
  nombre: number,
  jours: number
): ConclusionAnalyse {
  return { id, titre, conclusion, preuves, confiance, justificationConfiance: justificationConfiance(confiance, nombre, jours) };
}

function analyserQualite(valides: Mesure[], datees: MesureDatee[]): QualiteDonnees {
  const couverture = valides.length ? arrondir((datees.length / valides.length) * 100) : 0;
  const jours = joursDistincts(datees);
  const limites: string[] = [];
  if (valides.length < 10) limites.push("Moins de 10 mesures : les tendances sont exploratoires.");
  if (jours < 3) limites.push("Les mesures couvrent moins de 3 jours.");
  if (couverture < 100) limites.push(`${100 - couverture}% des mesures valides n’ont pas de date exploitable.`);
  return {
    nombreMesures: valides.length,
    mesuresDatees: datees.length,
    couvertureDatesPourcentage: couverture,
    joursCouverts: jours,
    niveau: niveauConfiance(valides.length, jours, couverture),
    limites,
  };
}

function comparerPeriode(
  periode: typeof PERIODES[number],
  datees: MesureDatee[],
  reference: number
): ComparaisonPeriode {
  const debutActuel = reference - periode.jours * JOUR;
  const debutPrecedent = debutActuel - periode.jours * JOUR;
  const actuelle = statistiques(periode.cle, periode.libelle, datees.filter(({ temps }) => temps > debutActuel && temps <= reference));
  const precedente = statistiques(periode.cle, `${periode.jours} jours précédents`, datees.filter(({ temps }) => temps > debutPrecedent && temps <= debutActuel));
  const diff = (a: number | null, b: number | null) => a === null || b === null ? null : arrondir(a - b);
  const variationMoyenne = diff(actuelle.moyenne, precedente.moyenne);
  const variationCible = diff(actuelle.cible, precedente.cible);
  const variationHypo = diff(actuelle.hypo, precedente.hypo);
  const confiance: NiveauConfiance = actuelle.confiance === "élevé" && precedente.confiance === "élevé"
    ? "élevé"
    : actuelle.confiance !== "faible" && precedente.confiance !== "faible" ? "modéré" : "faible";
  let interpretation = "Comparaison impossible : une des deux périodes contient trop peu de mesures.";
  if (variationCible !== null && variationMoyenne !== null) {
    if (variationCible >= 5) interpretation = `Amélioration possible : +${variationCible} points dans la cible et ${variationMoyenne > 0 ? "+" : ""}${variationMoyenne} mg/dL de moyenne.`;
    else if (variationCible <= -5) interpretation = `Régression possible : ${variationCible} points dans la cible et ${variationMoyenne > 0 ? "+" : ""}${variationMoyenne} mg/dL de moyenne.`;
    else interpretation = `Période globalement stable : ${variationCible > 0 ? "+" : ""}${variationCible} point(s) dans la cible.`;
  }
  return { periode: periode.cle, libelle: periode.libelle, actuelle, precedente, variationMoyenne, variationCible, variationHypo, interpretation, confiance };
}

function fenetrePourType(type: string): { avant: number; apresDebut: number; apresFin: number } {
  const normalise = type.toLocaleLowerCase("fr");
  if (normalise.includes("insuline")) return { avant: 2, apresDebut: 0, apresFin: 4 };
  if (normalise.includes("activité") || normalise.includes("sport")) return { avant: 2, apresDebut: 0, apresFin: 3 };
  if (normalise.includes("sommeil")) return { avant: 1, apresDebut: 4, apresFin: 10 };
  return { avant: 2, apresDebut: 0.5, apresFin: 3 };
}

function analyserCorrelations(datees: MesureDatee[], journal: JournalEntry[]): CorrelationJournal[] {
  const groupes = new Map<string, JournalEntry[]>();
  journal.forEach((entree) => {
    const type = entree.type?.trim() || "Autre";
    const groupe = groupes.get(type);
    if (groupe) groupe.push(entree); else groupes.set(type,[entree]);
  });
  const correlations: CorrelationJournal[] = [];
  groupes.forEach((entrees, type) => {
    const differences: number[] = [];
    const exemples: string[] = [];
    const instants = new Set<number>();
    const jours = new Set<string>();
    entrees.forEach((entree) => {
      const temps = obtenirTimestamp(entree);
      if (temps === null || instants.has(temps)) return;
      const fenetre = fenetrePourType(type);
      const avant = datees.filter((m) => m.temps >= temps - fenetre.avant * 60 * 60 * 1_000 && m.temps < temps);
      const apres = datees.filter((m) => m.temps >= temps + fenetre.apresDebut * 60 * 60 * 1_000 && m.temps <= temps + fenetre.apresFin * 60 * 60 * 1_000);
      if (!avant.length || !apres.length) return;
      const moyenneAvant = avant.reduce((s, m) => s + m.valeur, 0) / avant.length;
      const moyenneApres = apres.reduce((s, m) => s + m.valeur, 0) / apres.length;
      instants.add(temps);
      const dateEvenement = new Date(temps);
      jours.add(`${dateEvenement.getFullYear()}-${dateEvenement.getMonth()}-${dateEvenement.getDate()}`);
      differences.push(moyenneApres - moyenneAvant);
      if (exemples.length < 3) exemples.push(`${entree.description || type} : ${arrondir(moyenneAvant)} → ${arrondir(moyenneApres)} mg/dL`);
    });
    if (!differences.length) return;
    const difference = arrondir(differences.reduce((s, valeur) => s + valeur, 0) / differences.length);
    const confiance = differences.length >= 5 && jours.size >= 3 ? "élevé" : differences.length >= 2 && jours.size >= 2 ? "modéré" : "faible";
    const direction = difference >= 15 ? `hausse moyenne de ${difference} mg/dL` : difference <= -15 ? `baisse moyenne de ${Math.abs(difference)} mg/dL` : `variation moyenne limitée (${difference > 0 ? "+" : ""}${difference} mg/dL)`;
    correlations.push({
      id: `journal-${type.toLocaleLowerCase("fr").replace(/\s+/g, "-")}`,
      typeEvenement: type,
      description: `${direction} dans la fenêtre observée après les événements « ${type} »`,
      nombreEvenements: entrees.length,
      evenementsExploitables: differences.length,
      joursCouverts: jours.size,
      differenceMoyenne: difference,
      conclusion: `Association observée, sans preuve de causalité : ${direction}.`,
      preuves: exemples,
      confiance,
    });
  });
  return correlations.sort((a, b) => b.evenementsExploitables - a.evenementsExploitables);
}

function analyserMotifs(datees: MesureDatee[], qualite: QualiteDonnees): ConclusionAnalyse[] {
  const groupes = new Map<string, MesureDatee[]>();
  datees.forEach((mesure) => {
    const heure = new Date(mesure.temps).getHours();
    const plage = heure < 6 ? "nuit (0 h–6 h)" : heure < 12 ? "matin (6 h–12 h)" : heure < 18 ? "après-midi (12 h–18 h)" : "soir (18 h–24 h)";
    const groupe = groupes.get(plage);
    if (groupe) groupe.push(mesure); else groupes.set(plage,[mesure]);
  });
  const motifsHoraires = Array.from(groupes.entries()).flatMap(([plage, mesures]) => {
    if (mesures.length < 3) return [];
    const horsCible = mesures.filter(({ valeur }) => valeur < 70 || valeur > 180).length;
    const proportion = arrondir((horsCible / mesures.length) * 100);
    if (proportion < 40) return [];
    const confiance = niveauConfiance(mesures.length, joursDistincts(mesures), qualite.couvertureDatesPourcentage);
    return [creerConclusion(
      `plage-${plage}`,
      `Période à surveiller : ${plage}`,
      `${proportion}% des mesures de cette plage sont hors de la zone 70–180 mg/dL.`,
      [`${horsCible} mesure(s) hors zone sur ${mesures.length}`],
      confiance,
      mesures.length,
      joursDistincts(mesures)
    )];
  });
  const nomsJours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const groupesJours = new Map<string, MesureDatee[]>();
  datees.forEach((mesure) => {
    const jour = nomsJours[new Date(mesure.temps).getDay()];
    const groupe = groupesJours.get(jour);
    if (groupe) groupe.push(mesure); else groupesJours.set(jour,[mesure]);
  });
  const motifsJours = Array.from(groupesJours.entries()).flatMap(([jour, mesures]) => {
    if (mesures.length < 3) return [];
    const horsCible = mesures.filter(({ valeur }) => valeur < 70 || valeur > 180).length;
    const proportion = arrondir((horsCible / mesures.length) * 100);
    if (proportion < 40) return [];
    const confiance = niveauConfiance(mesures.length, joursDistincts(mesures), qualite.couvertureDatesPourcentage);
    return [creerConclusion(
      `jour-${jour}`,
      `Jour à surveiller : ${jour}`,
      `${proportion}% des mesures enregistrées le ${jour} sont hors de la zone 70–180 mg/dL.`,
      [`${horsCible} mesure(s) hors zone sur ${mesures.length}`],
      confiance,
      mesures.length,
      joursDistincts(mesures)
    )];
  });
  return [...motifsHoraires, ...motifsJours];
}

function alertesSecurite(datees: MesureDatee[]): AlerteSecurite[] {
  const tresBasses = datees.filter(({ valeur }) => valeur < 54);
  const basses = datees.filter(({ valeur }) => valeur >= 54 && valeur < 70);
  const tresHautes = datees.filter(({ valeur }) => valeur > 250);
  const alertes: AlerteSecurite[] = [];
  if (tresBasses.length) alertes.push({
    niveau: "urgente",
    titre: "Mesure(s) inférieure(s) à 54 mg/dL détectée(s)",
    message: "Une valeur très basse peut nécessiter une action immédiate selon ton plan personnel. En cas de confusion, perte de connaissance, convulsions ou impossibilité de te traiter, appelle les secours.",
    preuves: [`${tresBasses.length} mesure(s), minimum ${tresBasses.reduce((min,{valeur})=>Math.min(min,valeur),Infinity)} mg/dL`],
  });
  else if (basses.length) alertes.push({
    niveau: "vigilance",
    titre: "Mesure(s) sous 70 mg/dL détectée(s)",
    message: "Vérifie la mesure et suis le plan convenu avec ton équipe soignante. Diabia ne recommande aucune modification de traitement.",
    preuves: [`${basses.length} mesure(s) sous 70 mg/dL`],
  });
  if (tresHautes.length) alertes.push({
    niveau: "vigilance",
    titre: "Mesure(s) supérieure(s) à 250 mg/dL détectée(s)",
    message: "Si cette valeur persiste, si tu es malade ou si tu présentes des symptômes inhabituels, applique ton plan personnel de gestion des valeurs élevées et contacte un professionnel. La présence de cétones ou de symptômes sévères nécessite une aide urgente.",
    preuves: [`${tresHautes.length} mesure(s), maximum ${tresHautes.reduce((max,{valeur})=>Math.max(max,valeur),-Infinity)} mg/dL`],
  });
  return alertes;
}

export function analyserDonneesAvancees(mesures: Mesure[], journal: JournalEntry[] = []): RapportAnalyseAvancee {
  const valides = mesuresValides(mesures);
  const datees = mesuresDatees(valides);
  const qualite = analyserQualite(valides, datees);
  const reference = datees.at(-1)?.temps ?? null;
  const historique = statistiques("historique", "Tout l’historique", datees);
  const comparaisons = reference === null ? [] : PERIODES.map((periode) => comparerPeriode(periode, datees, reference));
  const statistiquesPeriodes = [...comparaisons.map(({ actuelle }) => actuelle), historique];
  const correlations = analyserCorrelations(datees, journal);
  const tendances = analyserMotifs(datees, qualite);
  const pointsPositifs: ConclusionAnalyse[] = [];
  const pointsPreoccupants: ConclusionAnalyse[] = [];

  if (historique.cible !== null && historique.cible >= 70 && qualite.nombreMesures >= 5) {
    pointsPositifs.push(creerConclusion("cible", "Mesures fréquemment dans la zone", `${historique.cible}% des mesures datées sont entre 70 et 180 mg/dL.`, [`${historique.nombreMesures} mesures analysées`], historique.confiance, historique.nombreMesures, historique.joursCouverts));
  }
  if (historique.coefficientVariation !== null && historique.coefficientVariation <= 36 && qualite.nombreMesures >= 5) {
    pointsPositifs.push(creerConclusion("variabilite", "Variabilité contenue", `Le coefficient de variation est de ${historique.coefficientVariation}%.`, ["Repère général : 36%"], historique.confiance, historique.nombreMesures, historique.joursCouverts));
  }
  if (historique.hypo !== null && historique.hypo > 4) {
    pointsPreoccupants.push(creerConclusion("hypo", "Mesures basses répétées", `${historique.hypo}% des mesures sont sous 70 mg/dL.`, [`${historique.hypoNiveau2}% sous 54 mg/dL`], historique.confiance, historique.nombreMesures, historique.joursCouverts));
  }
  if (historique.hyper !== null && historique.hyper > 25) {
    pointsPreoccupants.push(creerConclusion("hyper", "Mesures élevées fréquentes", `${historique.hyper}% des mesures dépassent 180 mg/dL.`, [`${historique.hyperSevere}% dépassent 250 mg/dL`], historique.confiance, historique.nombreMesures, historique.joursCouverts));
  }
  if (historique.coefficientVariation !== null && historique.coefficientVariation > 36) {
    pointsPreoccupants.push(creerConclusion("variabilite-elevee", "Variabilité élevée", `Le coefficient de variation est de ${historique.coefficientVariation}%.`, ["Repère général : 36%"], historique.confiance, historique.nombreMesures, historique.joursCouverts));
  }

  comparaisons.forEach((comparaison) => {
    if (comparaison.variationCible === null || Math.abs(comparaison.variationCible) < 5) return;
    tendances.push(creerConclusion(
      `comparaison-${comparaison.periode}`,
      comparaison.variationCible > 0 ? `Amélioration sur ${comparaison.libelle}` : `Régression sur ${comparaison.libelle}`,
      comparaison.interpretation,
      [`Période actuelle : ${comparaison.actuelle.nombreMesures} mesures`, `Période précédente : ${comparaison.precedente.nombreMesures} mesures`],
      comparaison.confiance,
      comparaison.actuelle.nombreMesures + comparaison.precedente.nombreMesures,
      comparaison.actuelle.joursCouverts + comparaison.precedente.joursCouverts
    ));
  });

  const causesProbables = correlations.filter(({ confiance, differenceMoyenne }) => confiance !== "faible" && differenceMoyenne !== null && Math.abs(differenceMoyenne) >= 15).map((correlation) =>
    creerConclusion(`cause-${correlation.id}`, `Association avec ${correlation.typeEvenement}`, correlation.conclusion, correlation.preuves, correlation.confiance, correlation.evenementsExploitables, correlation.joursCouverts)
  );
  tendances.filter(({ id }) => id.startsWith("plage-")).forEach((motif) => causesProbables.push({ ...motif, id: `cause-${motif.id}`, conclusion: `Cette plage horaire est associée à davantage de valeurs hors zone. Les données ne permettent pas d’en déterminer seules la cause.` }));

  const priorites = [...pointsPreoccupants, ...tendances.filter(({ titre }) => titre.startsWith("Régression"))].slice(0, 3);
  const conseils = priorites.map((priorite, index) => creerConclusion(
    `conseil-${index}`,
    `Documenter ${priorite.titre.toLocaleLowerCase("fr")}`,
    "Ajoute des notes précises sur le repas, l’activité, l’insuline, le sommeil, le stress ou la maladie autour de ces épisodes, puis partage les observations répétées avec ton équipe soignante.",
    priorite.preuves,
    priorite.confiance,
    qualite.nombreMesures,
    qualite.joursCouverts
  ));

  const resumeGeneral = !valides.length
    ? "Aucune mesure valide n’est disponible pour construire un rapport."
    : qualite.niveau === "faible"
      ? `Rapport exploratoire basé sur ${valides.length} mesure(s). Davantage de données datées sont nécessaires avant de conclure sur une tendance.`
      : `Rapport basé sur ${valides.length} mesures couvrant ${qualite.joursCouverts} jours, avec un niveau de confiance ${qualite.niveau}.`;

  return {
    genereLe: new Date().toISOString(),
    referenceTemporelle: reference === null ? null : new Date(reference).toISOString(),
    qualite,
    resumeGeneral,
    pointsPositifs,
    pointsPreoccupants,
    tendances,
    correlations,
    comparaisons,
    causesProbables,
    conseils,
    priorites,
    alertesSecurite: alertesSecurite(datees),
    statistiquesPeriodes,
  };
}
