import assert from "node:assert/strict";
import test from "node:test";
import { activerEspaceCompte, supprimerDonneesLocales, exporterDonneesLocales, lireValeurLocale, migrerStockageLocal, restaurerDonneesLocales, sauvegarderLocal, verifierStockage } from "../lib/storage";
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

test("l'export refuse un stockage inaccessible ou corrompu au lieu de produire une sauvegarde vide",()=>{
  const data=navigateur();data.set("mesures","{cassé");assert.throws(()=>exporterDonneesLocales());
  navigateur(()=>{throw new Error("Bloqué");});assert.throws(()=>exporterDonneesLocales());
});
test("un export puis une restauration conservent mesures, décimales, zéro et journal",()=>{
  const data=navigateur();
  const original={version:2,mesures:[{id:"m1",glycemie:120.5,insuline:0,date:"04/08/2026",heure:"08:00",note:"exemple"},{id:"m2",glycemie:130,insuline:2.25,date:"04/08/2026",heure:"12:00"}],journal:[{id:"j1",description:"marche",date:"04/08/2026"}],profil:{prenom:"Exemple",uniteGlycemie:"mmol/L"}};
  assert.ok(restaurerDonneesLocales(original));
  const backup=JSON.parse(JSON.stringify(exporterDonneesLocales()));data.clear();
  assert.ok(restaurerDonneesLocales(backup));
  assert.deepEqual(JSON.parse(data.get("mesures")!),original.mesures);assert.deepEqual(JSON.parse(data.get("journal")!),original.journal);assert.deepEqual(JSON.parse(data.get("profil")!),original.profil);
});

test("une ligne stockée invalide est signalée et n’est pas perdue lors d’une nouvelle saisie",()=>{
  const data=navigateur();const raw=JSON.stringify([{glycemie:120},{glycemie:{invalide:true}}]);data.set("mesures",raw);
  assert.equal(verifierStockage(),"corrompu");
  assert.equal(sauvegarderLocal("mesures",[{glycemie:120},{glycemie:140}]),false);
  assert.equal(data.get("mesures"),raw);
});
test("une suppression interrompue remet les clés effacées quand le navigateur autorise le retour arrière",()=>{
  let echec=true;const data=navigateur((action,key)=>{if(action==='remove'&&key==='journal'&&echec){echec=false;throw Error('Refus');}});
  data.set('mesures','[{"glycemie":120}]');data.set('journal','[]');data.set('profil','{"prenom":"Exemple"}');data.set('diabia_sync_meta','{"revision":2}');
  const avant=[...data].sort();assert.equal(supprimerDonneesLocales(),false);assert.deepEqual([...data].sort(),avant);
});
test("les espaces de deux comptes restent indépendants après sauvegarde, restauration et retour au premier compte",()=>{
  const data=navigateur();
  activerEspaceCompte('compte-A');assert.ok(restaurerDonneesLocales({version:3,mesures:[{id:'A',glycemie:120}],journal:[],profil:{prenom:'A'}}));
  activerEspaceCompte('compte-B');assert.equal(exporterDonneesLocales().mesures.length,0);assert.ok(restaurerDonneesLocales({version:3,mesures:[{id:'B',glycemie:140}],journal:[],profil:{prenom:'B'}}));
  activerEspaceCompte('compte-A');assert.equal(exporterDonneesLocales().mesures[0].glycemie,120);assert.equal(exporterDonneesLocales().profil.prenom,'A');
  activerEspaceCompte('compte-B');assert.equal(exporterDonneesLocales().mesures[0].glycemie,140);assert.equal(data.size,10);
});
