type Props = {
  titre:string;
  valeur:number;
  unite?:string;
};



export default function Gauge({
  titre,
  valeur,
  unite="%"
}:Props){


  let couleur =
    "bg-green-500";


  if(valeur < 70){

    couleur =
    "bg-orange-500";

  }


  if(valeur < 40){

    couleur =
    "bg-red-500";

  }



  return (

    <div className="bg-white rounded-2xl shadow p-6">


      <h2 className="font-bold text-xl">
        {titre}
      </h2>



      <div className="mt-4 h-5 bg-gray-200 rounded-full overflow-hidden">


        <div
          className={`${couleur} h-full`}
          style={{
            width:`${Math.min(valeur,100)}%`
          }}
        />


      </div>



      <p className="text-3xl font-bold mt-4">
        {valeur}{unite}
      </p>


    </div>

  );

}