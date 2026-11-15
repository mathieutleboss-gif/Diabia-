export type Food = { id:string; nom:string; glucidesPour100g:number|null; source:string; barcode?:string; sourceUrl?:string; etat?:string; valeurSource?:string; groupe?:string; categorie?:string };
export interface FoodSource { readonly status:'simulation'|'configuration-requise'|'disponible'; rechercher(query:string):Promise<Food[]>; barcode(code:string):Promise<Food|null> }
const fictifs:Food[]=[{id:'exemple',nom:'Produit fictif',glucidesPour100g:20,source:'Données fictives',barcode:'0000000000000'}];
export const demoFood:FoodSource={status:'simulation',async rechercher(q){return q.trim()?fictifs.filter(f=>f.nom.toLowerCase().includes(q.trim().toLowerCase())):[];},async barcode(c){return fictifs.find(f=>f.barcode===c)??null;}};
export const MAX_PORTION_GRAMS=2000;
export function poidsEnGrammes(raw:string):number|null {if(!/^\d+(?:[.,]\d+)?$/.test(raw.trim()))return null;const n=Number(raw.trim().replace(',','.'));return n>0&&n<=MAX_PORTION_GRAMS?n:null;}
export function glucides(food:Food,portion:number):number|null {if (!Number.isFinite(portion)||portion<=0||portion>MAX_PORTION_GRAMS||food.glucidesPour100g===null||!Number.isFinite(food.glucidesPour100g)||food.glucidesPour100g<0||food.glucidesPour100g>100)return null;return Math.round(food.glucidesPour100g*portion)/100;}
