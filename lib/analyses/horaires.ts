export function analyserHoraires(mesures:any[]) {


  if(!mesures || mesures.length === 0){

    return {
      message:"Pas assez de données."
    };

  }



  let matin = 0;
  let midi = 0;
  let soir = 0;
  let nuit = 0;



  mesures.forEach((mesure)=>{


    const valeur =
      Number(mesure.glycemie);



    if(valeur <= 180){
      return;
    }



    if(!mesure.heure){
      return;
    }



    const heure =
      Number(
        mesure.heure.split(":")[0]
      );



    if(heure >= 6 && heure < 12){

      matin++;

    }

    else if(heure >= 12 && heure < 18){

      midi++;

    }

    else if(heure >=18 && heure <24){

      soir++;

    }

    else {

      nuit++;

    }


  });





  const periodes = [

    {
      nom:"matin",
      valeur:matin
    },

    {
      nom:"midi",
      valeur:midi
    },

    {
      nom:"soir",
      valeur:soir
    },

    {
      nom:"nuit",
      valeur:nuit
    }

  ];





  periodes.sort(
    (a,b)=>
    b.valeur-a.valeur
  );





  const principale =
    periodes[0];





  let message =
  "Aucune période problématique détectée.";





  if(principale.valeur > 0){


    message =
    `Les hyperglycémies apparaissent principalement le ${principale.nom} (${principale.valeur} épisode(s) détecté(s)).`;


  }




  return {

    matin,

    midi,

    soir,

    nuit,

    message

  };


}