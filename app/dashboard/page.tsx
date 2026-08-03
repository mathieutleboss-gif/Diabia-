"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Gauge from "../components/Gauge";
import { analyserGlycemie } from "../../lib/analyse";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";



export default function Dashboard(){


  const [mesures,setMesures] = useState<any[]>([]);
  const [profil,setProfil] = useState<any>({});
  const [journal,setJournal] = useState<any[]>([]);



  useEffect(()=>{


    const data =
    JSON.parse(
      localStorage.getItem("mesures") || "[]"
    );


    const profilData =
    JSON.parse(
      localStorage.getItem("profil") || "{}"
    );


    const journalData =
    JSON.parse(
      localStorage.getItem("journal") || "[]"
    );



    setMesures(data);
    setProfil(profilData);
    setJournal(journalData);



  },[]);






  const analyse =
  analyserGlycemie(mesures);





  const stabilite =
  Math.max(
    0,
    Math.min(
      100,
      analyse.score || analyse.cible || 0
    )
  );







return (

<main className="min-h-screen bg-blue-50 p-8">



<h1 className="text-4xl font-bold text-blue-600">
Tableau de bord Diabia
</h1>






<div className="mt-6 flex gap-4 flex-wrap">


<Link
href="/import"
className="bg-blue-600 text-white px-6 py-3 rounded-xl"
>
Importer CSV
</Link>



<Link
href="/journal"
className="bg-green-600 text-white px-6 py-3 rounded-xl"
>
Journal
</Link>



<Link
href="/profile"
className="bg-gray-600 text-white px-6 py-3 rounded-xl"
>
Profil
</Link>


</div>








<div className="grid md:grid-cols-3 gap-6 mt-8">


<Gauge
titre="⭐ Stabilité Diabia"
valeur={stabilite}
/>



<Gauge
titre="🎯 Temps dans la cible"
valeur={analyse.cible || 0}
/>



<Gauge
titre="🔴 Hyperglycémies"
valeur={analyse.hyper || 0}
/>



</div>









<div className="bg-white rounded-2xl shadow p-6 mt-8">


<h2 className="text-2xl font-bold">
Analyse Diabia 🤖
</h2>



<p className="mt-4 whitespace-pre-line">
{analyse.message}
</p>







<div className="grid md:grid-cols-3 gap-4 mt-6">



<div className="bg-green-50 rounded-xl p-4">

<h3 className="font-bold text-green-700">
🟢 Points positifs
</h3>


{
analyse.explication?.positif?.map(
(item:string,index:number)=>(

<p
key={index}
className="mt-2"
>
{item}
</p>

))
}



</div>







<div className="bg-orange-50 rounded-xl p-4">


<h3 className="font-bold text-orange-700">
🟠 À améliorer
</h3>


{
analyse.explication?.problemes?.map(
(item:string,index:number)=>(

<p
key={index}
className="mt-2"
>
{item}
</p>

))
}



</div>








<div className="bg-blue-50 rounded-xl p-4">


<h3 className="font-bold text-blue-700">
💡 Ce que Diabia remarque
</h3>



{
analyse.explication?.conseils?.map(
(item:string,index:number)=>(

<p
key={index}
className="mt-2"
>
{item}
</p>

))
}



</div>



</div>



</div>









<div className="bg-white rounded-2xl shadow p-6 mt-8">


<h2 className="text-2xl font-bold">
🤖 Ce que Diabia a découvert
</h2>



<p className="mt-4 whitespace-pre-line">

{
analyse.journal?.message ||

"Diabia analyse encore tes habitudes."
}

</p>



</div>









<div className="bg-white rounded-2xl shadow p-6 mt-8">


<h2 className="text-2xl font-bold">
📒 Journal récent
</h2>





{

journal.length === 0 ?


<p className="mt-4">
Aucun événement enregistré.
</p>


:


journal
.slice(-5)
.reverse()
.map(
(item:any,index:number)=>(



<div
key={index}
className="mt-4 p-4 bg-blue-50 rounded-xl"
>



<p className="font-bold">


{
item.type === "Repas"
?
"🍽️"
:
item.type === "Insuline"
?
"💉"
:
"🏃"
}


{" "}

{item.type}


</p>



<p>
{item.heure} - {item.description}
</p>



</div>


))


}



</div>









<div className="bg-white rounded-2xl shadow p-6 mt-8">


<h2 className="text-xl font-bold">
👤 Mon profil
</h2>



<p>
Diabète :
{profil.diabete || " Non renseigné"}
</p>



<p>
Appareil :
{profil.appareil || " Non renseigné"}
</p>



<p>
Objectif :
{profil.objectif || " Non renseigné"}
</p>



</div>









<div className="bg-white rounded-2xl shadow p-6 mt-8">


<h2 className="text-xl font-bold">
📈 Evolution glycémie
</h2>




<div className="h-64 mt-6">


<ResponsiveContainer
width="100%"
height="100%"
>


<LineChart data={mesures}>


<CartesianGrid />


<XAxis dataKey="date"/>


<YAxis />


<Tooltip />


<Line
type="monotone"
dataKey="glycemie"
/>


</LineChart>


</ResponsiveContainer>



</div>



</div>







</main>

);


}