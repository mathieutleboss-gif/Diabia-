export function analyserTendance(mesures:any[]) {


  if(!mesures || mesures.length < 4){

    return {
      message:
      "Pas assez de données pour analyser la tendance."
    };

  }



  const milieu =
    Math.floor(
      mesures.length / 2
    );



  const debut =
    mesures.slice(
      0,
      milieu
    );



  const fin =
    mesures.slice(
      milieu
    );




  const moyenne = (liste:any[]) => {


    const valeurs =
      liste.map(
        (m)=>Number(m.glycemie)
      );


    return Math.round(
      valeurs.reduce(
        (a,b)=>a+b,
        0
      )
      /
      valeurs.length
    );


  };





  const moyenneDebut =
    moyenne(debut);



  const moyenneFin =
    moyenne(fin);





  const difference =
    moyenneFin - moyenneDebut;




  let message = "";



  if(difference > 20){


    message =
    `La glycémie moyenne augmente sur la période (+${difference} mg/dL). Diabia détecte une dégradation récente.`;

  }


  else if(difference < -20){


    message =
    `La glycémie moyenne diminue sur la période (${difference} mg/dL). Diabia détecte une amélioration récente.`;

  }


  else {


    message =
    "La tendance glycémique reste globalement stable sur la période.";

  }





  return {


    moyenneDebut,

    moyenneFin,

    difference,

    message


  };


}