export function analyserJournal(
mesures:any[],
journal:any[]
){


if(
!mesures.length ||
!journal.length
){

return {

message:
"Pas assez de données du journal pour analyser les liens."

};

}



let remarques:string[] = [];





const repas =
journal.filter(
(item:any)=>
item.type === "Repas"
);





repas.forEach((repas:any)=>{


const heureRepas =
Number(
repas.heure.split(":")[0]
);




const apresRepas =
mesures.filter((mesure:any)=>{


if(!mesure.heure){

return false;

}



const heure =
Number(
mesure.heure.split(":")[0]
);



return (
heure >= heureRepas &&
heure <= heureRepas + 3
);


});





const hyper =
apresRepas.filter(
(m:any)=>
Number(m.glycemie)>180
);






if(
hyper.length > apresRepas.length / 2
){

remarques.push(

`Après le repas "${repas.description}", Diabia remarque souvent une hausse de glycémie.`

);

}



});






if(remarques.length===0){


remarques.push(

"Diabia n'a pas encore trouvé de lien évident entre les événements et les variations."

);

}





return {


message:
remarques.join("\n"),


remarques


};


}