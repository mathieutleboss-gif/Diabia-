import data from './ciqual-2025.json';
import type {Food,FoodSource} from './core';
export function normaliserRecherche(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function etatAliment(nom:string){const s=normaliserRecherche(nom),cru=/\bcru(?:e|es|s)?\b/.test(s),cuit=/\bcuit(?:e|es|s)?\b/.test(s);if(cru&&cuit)return 'Préparation mixte : voir le libellé';if(cru)return 'Cru';if(cuit)return 'Cuit';return 'Voir le libellé';}
export const alimentsCiqual:Food[]=data.foods.map(f=>({...f,id:'ciqual:'+f.id,source:data.source,sourceUrl:data.url,etat:etatAliment(f.nom)}));
const indexed=alimentsCiqual.map(f=>({food:f,name:normaliserRecherche(f.nom)}));
export const ciqualSource:FoodSource={status:'disponible',async rechercher(query){
 const q=normaliserRecherche(query);if(q.length<2||q.length>100)return [];
 const terms=q.split(' ');return indexed.filter(f=>terms.every(t=>f.name.split(' ').some(word=>word.startsWith(t)))).sort((a,b)=>Number(b.name.startsWith(q))-Number(a.name.startsWith(q))||a.food.nom.length-b.food.nom.length||a.food.nom.localeCompare(b.food.nom,'fr')).slice(0,30).map(f=>f.food);
},async barcode(){return null;}};
