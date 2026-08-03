"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMeasure() {
const router = useRouter();
  const [glycemie, setGlycemie] = useState("");
  const [insuline, setInsuline] = useState("");
  const [note, setNote] = useState("");

  function enregistrer() {

    const nouvelleMesure = {
      glycemie,
      insuline,
      note,
      date: new Date().toLocaleString(),
    };


    const anciennesMesures = JSON.parse(
      localStorage.getItem("mesures") || "[]"
    );


    const toutesLesMesures = [
      ...anciennesMesures,
      nouvelleMesure
    ];


    localStorage.setItem(
      "mesures",
      JSON.stringify(toutesLesMesures)
    );


    alert("Mesure ajoutée !");
router.push("/dashboard");

    setGlycemie("");
    setInsuline("");
    setNote("");
  }


  return (
    <main className="min-h-screen bg-blue-50 p-8">

      <h1 className="text-4xl font-bold text-blue-600">
        Ajouter une mesure
      </h1>


      <div className="mt-8 bg-white rounded-2xl shadow p-6">


        <label>
          Glycémie (mg/dL)
        </label>

        <input
          className="border rounded-lg p-3 w-full mt-2"
          value={glycemie}
          onChange={(e)=>setGlycemie(e.target.value)}
          placeholder="Ex : 120"
        />


        <label className="block mt-5">
          Insuline rapide (unités)
        </label>

        <input
          className="border rounded-lg p-3 w-full mt-2"
          value={insuline}
          onChange={(e)=>setInsuline(e.target.value)}
          placeholder="Ex : 4"
        />


        <label className="block mt-5">
          Note
        </label>

        <textarea
          className="border rounded-lg p-3 w-full mt-2"
          value={note}
          onChange={(e)=>setNote(e.target.value)}
          placeholder="Repas, sport..."
        />


        <button
          onClick={enregistrer}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Enregistrer
        </button>


      </div>

    </main>
  );
}