"use client";

import { useState } from "react";


export default function Assistant(){


const [question,setQuestion] = useState("");

const [reponse,setReponse] = useState("");

const [chargement,setChargement] = useState(false);




async function envoyer(){


setChargement(true);



const rapport = {


profil:

JSON.parse(
localStorage.getItem("profil") || "{}"
),



glycemie:{


tempsDansCible:67,

hyperglycemies:20,

hypoglycemies:5,

score:65


},



stabilite:{


variations:10


}



};






const resultat = await fetch(
"/api/assistant",
{


method:"POST",


headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

question,

rapport

})


}

);





const data =
await resultat.json();





setReponse(
data.reponse
);



setChargement(false);


}








return (


<main className="min-h-screen bg-blue-50 p-8">



<div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">



<h1 className="text-3xl font-bold text-blue-600">
🤖 Assistant Diabia
</h1>



<p className="mt-4">
Pose une question sur tes données.
</p>






<input


className="mt-6 border rounded-xl p-3 w-full"


placeholder="Ex : Pourquoi mon score est bas ?"


value={question}


onChange={(e)=>

setQuestion(e.target.value)

}


/>






<button


onClick={envoyer}


className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"


>


{
chargement
?
"Analyse..."
:
"Demander à Diabia"
}



</button>







{

reponse &&


<div className="mt-6 bg-blue-50 rounded-xl p-4">


<p className="whitespace-pre-line">

🤖 {reponse}

</p>


</div>


}





</div>



</main>


);


}
