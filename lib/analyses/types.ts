export type RapportDiabia = {
  score: number;

  moyenne: number;
  cible: number;
  hyper: number;
  hypo: number;

  maximum: number;
  minimum: number;

  message: string;
  resume: string;

  variations: {
    nombre: number;
    message: string;
  };

  horaires: {
    message: string;
  };

  tendance: {
    message: string;
  };

  explication: {
    positif: string[];
    problemes: string[];
    conseils: string[];
  };

  journal: {
    message: string;
  };
};