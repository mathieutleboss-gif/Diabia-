export function analyserCSV(lignes: any[]) {

  return lignes.map((ligne) => {

    const glycemie =
      ligne.glycemie ||
      ligne.glucose ||
      ligne.Glucose ||
      ligne.Glucose ||
      ligne.sg ||
      ligne.SG ||
      0;


    const insuline =
      ligne.insuline ||
      ligne.Insuline ||
      ligne.insulin ||
      0;


    const date =
      ligne.date ||
      ligne.Date ||
      new Date().toLocaleDateString();



    return {

      glycemie: Number(glycemie),

      insuline: Number(insuline),

      date,

      note: "Import CSV"

    };

  });

}