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
};
