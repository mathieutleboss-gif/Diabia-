import {lireValeurLocale,sauvegarderLocal} from '../storage';
import {foodById} from './ciqual';
export const NUTRITION_PREFS_KEY='diabia_nutrition_preferences_v1';
export type Preferences={version:1;favoris:string[];recents:string[]};
export const emptyPreferences=():Preferences=>({version:1,favoris:[],recents:[]});
export function normaliserPreferences(value:unknown):Preferences{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Préférences invalides');const v=value as Record<string,unknown>;
 if(v.version!==1||!Array.isArray(v.favoris)||!Array.isArray(v.recents))throw Error('Préférences invalides');
 const ids=(a:unknown[],limit:number)=>[...new Set(a.filter((s):s is string=>typeof s==='string'&&foodById.has(s)))].slice(0,limit);
 return {version:1,favoris:ids(v.favoris,200),recents:ids(v.recents,12)};
}
export function lirePreferences(){return normaliserPreferences(JSON.parse(lireValeurLocale(NUTRITION_PREFS_KEY,JSON.stringify(emptyPreferences()))));}
export function enregistrerPreferences(p:Preferences){try{lirePreferences();return sauvegarderLocal(NUTRITION_PREFS_KEY,normaliserPreferences(p),{notifier:false});}catch{return false;}}
export function choisirRecent(p:Preferences,id:string):Preferences{return normaliserPreferences({...p,recents:[id,...p.recents.filter(x=>x!==id)]});}
export function basculerFavori(p:Preferences,id:string):Preferences{return normaliserPreferences({...p,favoris:p.favoris.includes(id)?p.favoris.filter(x=>x!==id):[id,...p.favoris]});}
