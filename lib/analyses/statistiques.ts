export function statistiques(mesures:any[]) {


const valeurs = mesures.map(
(m)=>Number(m.glycemie)
);



if(valeurs.length===0){

return {
moyenne:0,
cible:0,
hyper:0,
hypo:0,
maximum:0,
minimum:0
};

}



const moyenne = Math.round(
valeurs.reduce((a,b)=>a+b,0)
/ valeurs.length
);



const cible = valeurs.filter(
(v)=>v>=70 && v<=180
).length;



const hyper = valeurs.filter(
(v)=>v>180
).length;



const hypo = valeurs.filter(
(v)=>v<70
).length;



return {

moyenne,

cible:
Math.round(
(cible/valeurs.length)*100
),


hyper:
Math.round(
(hyper/valeurs.length)*100
),


hypo:
Math.round(
(hypo/valeurs.length)*100
),


maximum:
Math.max(...valeurs),


minimum:
Math.min(...valeurs)

};


}