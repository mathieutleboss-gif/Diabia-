export function creerResume(analyse:any) {


  let positif:string[] = [];
  let attention:string[] = [];
  let alertes:string[] = [];



  if(analyse.cible >= 70){

    positif.push(
      "La majorité des glycémies sont dans la cible."
    );

  }
  else {

    attention.push(
      "Le temps dans la cible pourrait être amélioré."
    );

  }




  if(analyse.hyper <= 20){

    positif.push(
      "Le nombre d'hyperglycémies reste limité."
    );

  }
  else {

    alertes.push(
      "Beaucoup d'hyperglycémies sont détectées."
    );

  }




  if(analyse.hypo > 5){

    alertes.push(
      "Plusieurs hypoglycémies sont présentes."
    );

  }




  if(analyse.maximum > 250){

    attention.push(
      `Des pics élevés sont présents (maximum ${analyse.maximum} mg/dL).`
    );

  }




  return {


    positif,

    attention,

    alertes


  };


}