export function expliquerScore(analyse:any, score:number){


  let positif:string[] = [];
  let problemes:string[] = [];
  let remarques:string[] = [];



  // POINTS POSITIFS

  if(analyse.cible >= 80){

    positif.push(
      `Très bonne stabilité : ${analyse.cible}% des mesures sont dans la cible.`
    );

  }

  else if(analyse.cible >= 50){

    positif.push(
      `${analyse.cible}% des mesures sont dans la cible. Une partie de la journée est bien maîtrisée.`
    );

  }

  else {

    positif.push(
      "Les données permettent à Diabia d'identifier les périodes qui peuvent être améliorées."
    );

  }




  if(analyse.hypo <= 5){

    positif.push(
      "Peu de périodes d'hypoglycémie détectées."
    );

  }




  // PROBLEMES DETECTES


  if(analyse.cible < 70){

    problemes.push(
      "Le temps passé dans la zone idéale est encore limité."
    );

  }




  if(analyse.hyper > 20){

    problemes.push(
      `${analyse.hyper}% des mesures sont au-dessus de la cible.`
    );

  }




  if(analyse.hypo > 5){

    problemes.push(
      `${analyse.hypo}% des mesures sont en dessous de la cible.`
    );

  }




  if(analyse.variations?.nombre > 10){

    problemes.push(
      "Diabia détecte beaucoup de changements importants de glycémie."
    );

  }

  else if(analyse.variations?.nombre > 0){

    problemes.push(
      "Quelques variations importantes ont été détectées."
    );

  }







  // CE QUE DIABIA REMARQUE


  if(analyse.hyper > analyse.hypo){

    remarques.push(
      "La principale marge d'amélioration concerne les périodes où la glycémie reste trop élevée."
    );

  }



  if(analyse.variations?.nombre > 10){

    remarques.push(
      "Les courbes seraient plus stables avec moins de grandes montées et descentes."
    );

  }



  if(analyse.cible < 50){

    remarques.push(
      "Diabia conseille de se concentrer d'abord sur les grandes variations plutôt que sur les petits écarts."
    );

  }


  else if(analyse.cible >= 70){

    remarques.push(
      "La base est bonne, les prochaines améliorations concernent surtout la régularité."
    );

  }





  return {


    score,


    positif,


    problemes,


    conseils: remarques


  };


}