export function analyserVariations(mesures:any[]) {


  if(!mesures || mesures.length < 2){

    return {
      nombre:0,
      message:"Pas assez de mesures pour analyser les variations."
    };

  }



  let variations:any[] = [];



  for(let i = 1; i < mesures.length; i++){


    const avant =
      Number(mesures[i-1].glycemie);



    const apres =
      Number(mesures[i].glycemie);



    const difference =
      apres - avant;



    if(Math.abs(difference) >= 50){


      variations.push({

        difference,

        avant,

        apres,

        date:
        mesures[i].date,


        heure:
        mesures[i].heure || ""

      });


    }


  }




  if(variations.length===0){


    return {

      nombre:0,

      message:
      "Aucune variation importante détectée."

    };


  }





  const plusGrande =
    variations.sort(
      (a,b)=>
      Math.abs(b.difference)
      -
      Math.abs(a.difference)
    )[0];





  let message="";



  if(plusGrande.difference > 0){


    message =
    `Diabia détecte une montée importante de +${plusGrande.difference} mg/dL le ${plusGrande.date} à ${plusGrande.heure}. Passage de ${plusGrande.avant} à ${plusGrande.apres} mg/dL.`;



  } else {



    message =
    `Diabia détecte une baisse importante de ${plusGrande.difference} mg/dL le ${plusGrande.date} à ${plusGrande.heure}. Passage de ${plusGrande.avant} à ${plusGrande.apres} mg/dL.`;

  }





  return {

    nombre:variations.length,

    variations,

    message

  };


}