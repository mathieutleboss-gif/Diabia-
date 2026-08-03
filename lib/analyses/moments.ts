export function analyserMoments(mesures:any[]){


  if(!mesures || mesures.length === 0){

    return {

      message:
      "Pas assez de données pour analyser les moments."

    };

  }



  let periodes:any = {

    matin:{
      nom:"matin",
      total:0,
      problemes:0
    },


    midi:{
      nom:"midi",
      total:0,
      problemes:0
    },


    soir:{
      nom:"soir",
      total:0,
      problemes:0
    },


    nuit:{
      nom:"nuit",
      total:0,
      problemes:0
    }

  };






  mesures.forEach((mesure)=>{


    if(!mesure.heure){

      return;

    }



    const heure =
    Number(
      mesure.heure.split(":")[0]
    );



    let periode;



    if(heure >= 6 && heure < 12){

      periode = periodes.matin;

    }

    else if(heure >= 12 && heure < 18){

      periode = periodes.midi;

    }

    else if(heure >=18 && heure <24){

      periode = periodes.soir;

    }

    else{

      periode = periodes.nuit;

    }



    periode.total++;



    const glycemie =
    Number(mesure.glycemie);



    if(
      glycemie > 180 ||
      glycemie < 70
    ){

      periode.problemes++;

    }



  });






  const resultat =
  Object.values(periodes)
  .sort(
    (a:any,b:any)=>
    b.problemes - a.problemes
  )[0] as any;






  if(resultat.problemes === 0){


    return {

      message:
      "Diabia ne détecte pas de période particulièrement difficile."

    };


  }





  return {


    periode:
    resultat.nom,


    problemes:
    resultat.problemes,



    message:

    `Diabia remarque que les variations sont plus fréquentes le ${resultat.nom} (${resultat.problemes} mesure(s) hors cible détectée(s)).`

  };

}