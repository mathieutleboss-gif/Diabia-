"use client";

import { useState } from "react";
import Papa from "papaparse";
import { analyserCSV } from "../../lib/csvParser";


export default function ImportPage() {

  const [message, setMessage] = useState("");


  function importerFichier(event: any) {

    const fichier = event.target.files[0];


    if (!fichier) return;


    Papa.parse(fichier, {

      header: true,


      complete: function(result: any) {


        const donneesPropres = result.data.filter(
          (ligne: any) =>
            Object.keys(ligne).length > 1
        );


        const nouvellesMesures =
          analyserCSV(donneesPropres);



        localStorage.setItem(
          "mesures",
          JSON.stringify(nouvellesMesures)
        );


        setMessage(
          "Fichier CSV importé et analysé avec succès !"
        );


      }


    });


  }



  return (

    <main className="min-h-screen p-8">


      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">


        <h1 className="text-4xl font-bold text-blue-600">
          Importer mes données
        </h1>



        <p className="mt-6 text-gray-700">

          Sélectionne un fichier CSV contenant tes données de glycémie.

        </p>



        <label className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl cursor-pointer">

          Choisir un fichier CSV


          <input
            type="file"
            accept=".csv"
            onChange={importerFichier}
            className="hidden"
          />


        </label>



        <p className="mt-6 text-green-600 font-bold">

          {message}

        </p>



      </div>


    </main>

  );

}