"use client";

import { useState } from "react";



export default function Journal(){


const [type,setType] =
useState("Repas");


const [description,setDescription] =
useState("");


const [heure,setHeure] =
useState("");



function ajouter(){


const ancien =
JSON.parse(
localStorage.getItem("journal") || "[]"
);



const nouveau = {


type,

description,

heure,

date:
new Date().toLocaleDateString()


};



localStorage.setItem(
"journal",
JSON.stringify(
[
...ancien,
nouveau
]
)
);



setDescription("");

alert("Événement ajouté !");


}




return (


<main className="min-h-screen bg-blue-50 p-8">



<div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">


<h1 className="text-3xl font-bold text-blue-600">
Journal Diabia
</h1>


<p className="mt-4">
Ajoute les événements importants de ta journée.
</p>





<label className="block mt-6 font-bold">
Type
</label>


<select

className="mt-2 border rounded-xl p-3 w-full"

value={type}

onChange={(e)=>setType(e.target.value)}

>


<option>
Repas
</option>


<option>
Insuline
</option>


<option>
Activité
</option>


</select>







<label className="block mt-6 font-bold">
Heure
</label>


<input

type="time"

className="mt-2 border rounded-xl p-3 w-full"

value={heure}

onChange={(e)=>setHeure(e.target.value)}

 />







<label className="block mt-6 font-bold">
Description
</label>


<textarea

className="mt-2 border rounded-xl p-3 w-full"

placeholder="Ex : pizza, marche, injection..."

value={description}

onChange={(e)=>setDescription(e.target.value)}

 />







<button

onClick={ajouter}

className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"

>

Ajouter

</button>




</div>


</main>


);


}