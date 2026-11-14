export type InjectionInsuline = {
  id: string;
  dose: number;
  date: string;
  heure?: string;
  timestamp: string;
  type?: "non_precise" | "rapide" | "basale";
  source?: "csv" | "manuel";
  note?: string;
};

export type Mesure = {
  id?: string;
  glycemie: number | string;
  insuline?: number | string;
  date?: string;
  heure?: string;
  timestamp?: string;
  note?: string;
};

export type JournalEntry = {
  id?: string;
  type?: string;
  description?: string;
  heure?: string;
  date?: string;
  timestamp?: string;
};

export type ProfilDiabia = {
  prenom?: string;
  diabete?: string;
  appareil?: string;
  objectif?: string;
  uniteGlycemie?: "mg/dL" | "g/L" | "mmol/L";
};

export type AnalyseBase = {
  nombreMesures: number;
  moyenne: number;
  cible: number;
  hyper: number;
  hypo: number;
  maximum: number;
  minimum: number;
  variations: {
    nombre: number;
    message: string;
    variations?: Array<{
      difference: number;
      avant: number;
      apres: number;
      date?: string;
      heure?: string;
    }>;
  };
  horaires: {
    message: string;
    matin?: number;
    midi?: number;
    soir?: number;
    nuit?: number;
  };
  tendance: {
    message: string;
    moyenneDebut?: number;
    moyenneFin?: number;
    difference?: number;
  };
};

export type RapportDiabia = AnalyseBase & {
  score: number | null;
  message: string;
  resume: {
    positif: string[];
    attention: string[];
    alertes: string[];
  };
  explication: {
    score: number | null;
    positif: string[];
    problemes: string[];
    conseils: string[];
  };
  journal: {
    message: string;
    remarques?: string[];
  };
  insights: {
    titre: string;
    remarques: string[];
  };
  avance: RapportAnalyseAvancee;
};

export type NiveauConfiance = "faible" | "modéré" | "élevé";

export type ConclusionAnalyse = {
  id: string;
  titre: string;
  conclusion: string;
  preuves: string[];
  confiance: NiveauConfiance;
  justificationConfiance: string;
};

export type StatistiquesPeriode = {
  cle: "7j" | "14j" | "30j" | "historique";
  libelle: string;
  nombreMesures: number;
  mesuresDatees: number;
  joursCouverts: number;
  moyenne: number | null;
  minimum: number | null;
  maximum: number | null;
  cible: number | null;
  hyper: number | null;
  hypo: number | null;
  hyperSevere: number | null;
  hypoNiveau2: number | null;
  coefficientVariation: number | null;
  confiance: NiveauConfiance;
};

export type ComparaisonPeriode = {
  periode: "7j" | "14j" | "30j";
  libelle: string;
  actuelle: StatistiquesPeriode;
  precedente: StatistiquesPeriode;
  variationMoyenne: number | null;
  variationCible: number | null;
  variationHypo: number | null;
  interpretation: string;
  confiance: NiveauConfiance;
};

export type CorrelationJournal = {
  id: string;
  typeEvenement: string;
  description: string;
  nombreEvenements: number;
  evenementsExploitables: number;
  differenceMoyenne: number | null;
  conclusion: string;
  preuves: string[];
  confiance: NiveauConfiance;
};

export type QualiteDonnees = {
  nombreMesures: number;
  mesuresDatees: number;
  couvertureDatesPourcentage: number;
  joursCouverts: number;
  niveau: NiveauConfiance;
  limites: string[];
};

export type AlerteSecurite = {
  niveau: "vigilance" | "urgente";
  titre: string;
  message: string;
  preuves: string[];
};

export type RapportAnalyseAvancee = {
  genereLe: string;
  referenceTemporelle: string | null;
  qualite: QualiteDonnees;
  resumeGeneral: string;
  pointsPositifs: ConclusionAnalyse[];
  pointsPreoccupants: ConclusionAnalyse[];
  tendances: ConclusionAnalyse[];
  correlations: CorrelationJournal[];
  comparaisons: ComparaisonPeriode[];
  causesProbables: ConclusionAnalyse[];
  conseils: ConclusionAnalyse[];
  priorites: ConclusionAnalyse[];
  alertesSecurite: AlerteSecurite[];
  statistiquesPeriodes: StatistiquesPeriode[];
};
