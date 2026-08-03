export function calculerScore(analyse:any){


  let score = 0;



  // 60% du score vient du temps dans la cible

  score += analyse.cible * 0.6;



  // 20% vient de l'absence d'hyperglycémies

  score += (100 - analyse.hyper) * 0.2;



  // 10% vient de l'absence d'hypoglycémies

  score += (100 - analyse.hypo) * 0.1;



  // 10% vient de la stabilité

  let stabilite = 100;


  if(analyse.variations?.nombre){

    stabilite -= analyse.variations.nombre * 2;

  }


  if(stabilite < 0){

    stabilite = 0;

  }



  score += stabilite * 0.1;




  // Limites

  if(score < 0){

    score = 0;

  }


  if(score > 100){

    score = 100;

  }



  return Math.round(score);


}