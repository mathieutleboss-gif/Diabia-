import assert from "node:assert/strict";
import test from "node:test";
import { lireValeurLocale, migrerStockageLocal, restaurerDonneesLocales, sauvegarderLocal, verifierStockage } from "../lib/storage";
import { STORAGE_KEYS } from "../lib/storageKeys";
function navigateur(failure?: (action:string,key:string)=>void) {
  const data=new Map<string,string>();
  Object.defineProperty(globalThis,"window",{value:{dispatchEvent(){}},configurable:true});
  Object.defineProperty(globalThis,"localStorage",{value:{getItem(key:string){failure?.("get",key);return data.get(key)??null;},setItem(key:string,value:string){failure?.("set",key);data.set(key,value);},removeItem(key:string){failure?.("remove",key);data.delete(key);}},configurable:true});
  return data;
}
test("un stockage refusé ne fait pas planter la lecture, migration ou restauration",()=>{
  navigateur(()=>{throw new Error("SecurityError");});
  assert.equal(lireValeurLocale("mesures","[]"),"[]");
  assert.equal(migrerStockageLocal(),false);
  assert.equal(verifierStockage(),"bloque");
  assert.equal(restaurerDonneesLocales({mesures:[],journal:[],profil:{}}),false);
});
test("une sauvegarde invalide ne remplace aucune donnée",()=>{
  const data=navigateur();data.set("mesures",JSON.stringify([{glycemie:120}]));const avant=[...data];
  assert.equal(restaurerDonneesLocales({mesures:[{glycemie:"invalide"}],journal:[],profil:{}}),false);
  assert.deepEqual([...data],avant);
});
test("un échec d'écriture restaure les clés précédentes quand le stockage le permet",()=>{
  let echec=true;
  const data=navigateur((action,key)=>{if(action==="set"&&key==="journal"&&echec){echec=false;throw new Error("Quota");}});
  data.set("mesures",JSON.stringify([{id:"old",glycemie:120}]));data.set("journal","[]");data.set("profil",JSON.stringify({prenom:"Ancien"}));data.set(STORAGE_KEYS.version,"2");
  const avant=[...data];
  assert.equal(restaurerDonneesLocales({mesures:[{glycemie:130}],journal:[],profil:{prenom:"Nouveau"}}),false);
  assert.deepEqual([...data],avant);
});
test("la restauration attribue des identifiants uniques pour éviter l'édition de plusieurs lignes",()=>{
  const data=navigateur();
  assert.ok(restaurerDonneesLocales({version:2,mesures:[{id:"same",glycemie:"120,5"},{id:"same",glycemie:130}],journal:[{description:"repas"}],profil:{}}));
  const rows=JSON.parse(data.get("mesures")!);
  assert.equal(rows[0].glycemie,120.5);assert.notEqual(rows[0].id,rows[1].id);assert.equal(rows[0].id,"same");
  assert.ok(JSON.parse(data.get("journal")!)[0].id);
  assert.equal(verifierStockage(),"ok");
});
test("les données JSON corrompues sont signalées sans être effacées",()=>{
  const data=navigateur();data.set("mesures","{cassé");
  assert.equal(verifierStockage(),"corrompu");
  assert.equal(sauvegarderLocal("mesures",[{glycemie:140}]),false);
  assert.equal(data.get("mesures"),"{cassé");
});
