import data from './ciqual-2025.json';
import type {Food,FoodSource} from './core';
export function normaliserRecherche(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function etatAliment(nom:string){const s=normaliserRecherche(nom),cru=/\bcru(?:e|es|s)?\b/.test(s),cuit=/\bcuit(?:e|es|s)?\b/.test(s);if(cru&&cuit)return 'Préparation mixte : voir le libellé';if(cru)return 'Cru';if(cuit)return 'Cuit';return 'Voir le libellé';}
export const alimentsCiqual:Food[]=data.foods.map(f=>({...f,groupe:f.groupe||'Autres',categorie:f.categorie||f.groupe||'Autres',id:'ciqual:'+f.id,source:data.source,sourceUrl:data.url,etat:etatAliment(f.nom)}));
const indexed=alimentsCiqual.map(f=>({food:f,name:normaliserRecherche(f.nom)}));
export const foodById=new Map(alimentsCiqual.map(f=>[f.id,f]));
export const groupesCiqual=[...new Set(alimentsCiqual.map(f=>f.groupe||'Autres'))].sort((a,b)=>a.localeCompare(b,'fr'));
const populaires=['ciqual:13039','ciqual:13005','ciqual:13034','ciqual:9104','ciqual:9100','ciqual:7001','ciqual:20009'];
function popularite(id:string){const n=populaires.indexOf(id);return n<0?100:n;}
export function chercherAliments(query:string,options:{groupe?:string;etat?:string;ids?:string[]}={}){
 const q=normaliserRecherche(query);if(q.length>100)return {foods:[] as Food[],total:0};const terms=q.split(' ').filter(Boolean);
 let rows=indexed.filter(x=>(!options.ids||options.ids.includes(x.food.id))&&(!options.groupe||x.food.groupe===options.groupe)&&(!options.etat||x.food.etat===options.etat)&&terms.every(t=>x.name.split(' ').some(w=>w.startsWith(t))));
 rows=rows.sort((a,b)=>{if(options.ids&&!q)return options.ids.indexOf(a.food.id)-options.ids.indexOf(b.food.id);if(q)return Number(b.name.startsWith(q))-Number(a.name.startsWith(q))||a.food.nom.length-b.food.nom.length||a.food.nom.localeCompare(b.food.nom,'fr');return popularite(a.food.id)-popularite(b.food.id)||a.food.nom.localeCompare(b.food.nom,'fr');});
 return {foods:rows.slice(0,40).map(x=>x.food),total:rows.length};
}
export const ciqualSource:FoodSource={status:'disponible',async rechercher(query){
 const q=normaliserRecherche(query);if(q.length<2||q.length>100)return [];
 return chercherAliments(query).foods.slice(0,30);
},async barcode(){return null;}};
