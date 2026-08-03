"use client";

import { useState } from "react";



export default function Profile(){


const ancien =
JSON.parse(
localStorage.getItem("profil") || "{}"
);



const [profil,setProfil] =
useState({

diabete: ancien.diabete || "",

appareil: ancien.appareil || "",

objectif: ancien.objectif || ""

});





function sauvegarder(){


localStorage.setItem(
"profil",
JSON.stringify(profil)
);


alert("Profil enregistré !");


}






return (


<main className="min-h-screen bg-blue-50 p-8">



<div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">



<h1 className="text-3xl font-bold text-blue-600">
Profil Diabia
</h1>



<p className="mt-4">
Ces informations permettent à Diabia de personnaliser ses analyses.
</p>







<label className="block mt-6 font-bold">
Type de diabète
</label>



<select

className="mt-2 border rounded-xl p-3 w-full"

value={profil.diabete}

onChange={(e)=>

setProfil({

...profil,

diabete:e.target.value

})

}

>


<option value="">
Sélectionner
</option>


<option>
Type 1
</option>


<option>
Type 2
</option>


<option>
Autre
</option>


</select>









<label className="block mt-6 font-bold">
Appareil utilisé
</label>



<select

className="mt-2 border rounded-xl p-3 w-full"

value={profil.appareil}

onChange={(e)=>

setProfil({

...profil,

appareil:e.target.value

})

}

>


<option value="">
Sélectionner
</option>


<option>
Capteur glucose
</option>


<option>
Pompe à insuline
</option>


<option>
Stylo à insuline
</option>


</select>










<label className="block mt-6 font-bold">
Objectif principal
</label>



<select

className="mt-2 border rounded-xl p-3 w-full"

value={profil.objectif}

onChange={(e)=>

setProfil({

...profil,

objectif:e.target.value

})

}

>


<option value="">
Sélectionner
</option>


<option>
Améliorer la stabilité
</option>


<option>
Réduire les hyperglycémies
</option>


<option>
Réduire les hypoglycémies
</option>


<option>
Mieux comprendre mes variations
</option>


</select>







<button

onClick={sauvegarder}

className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl"

>

Enregistrer

</button>






</div>


</main>


);


}