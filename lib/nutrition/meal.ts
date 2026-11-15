import {foodById} from './ciqual';
import {poidsEnGrammes} from './core';
export type MealLine={foodId:string;grammes:string};
export function ajouterAliment(lines:MealLine[],id:string){if(!foodById.has(id)||lines.some(l=>l.foodId===id)||lines.length>=20)return lines;return [...lines,{foodId:id,grammes:'100'}];}
export function modifierPortion(lines:MealLine[],id:string,value:string){return lines.map(l=>l.foodId===id?{...l,grammes:value}:l);}
export function retirerAliment(lines:MealLine[],id:string){return lines.filter(l=>l.foodId!==id);}
export function totalRepas(lines:MealLine[]){let exact=0;for(const line of lines){const food=foodById.get(line.foodId),weight=poidsEnGrammes(line.grammes);if(!food||weight===null||food.glucidesPour100g===null)return null;exact+=food.glucidesPour100g*weight/100;}return Math.round(exact*100)/100;}
