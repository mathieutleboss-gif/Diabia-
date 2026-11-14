import assert from "node:assert/strict";
import test from "node:test";
import {analyserCSVDetaille,choisirEntete,detecterColonnes} from "../lib/csvParser";
import {fusionnerInjections} from "../lib/mesures";
import {resumerInsuline} from "../lib/insuline";
import {activerEspaceCompte,lireMesuresLocales,lireInjectionsLocales,restaurerDonneesLocales,sauvegardeHistoriqueNavigateur,supprimerDonneesLocales} from "../lib/storage";

test("une ligne d'injection sans glycémie est conservée sans inventer de mesure",()=>{
 const r=analyserCSVDetaille([{date:"04/08/2026",heure:"12:00",insuline:"2,5"},{date:"04/08/2026",heure:"12:05",glucose:"120"}],"mg/dL",{separerInjections:true});
 assert.equal(r.mesures.length,1);assert.equal(r.injections.length,1);assert.equal(r.injections[0].dose,2.5);assert.equal(r.lignesRejetees,0);assert.equal(r.mesures[0].insuline,undefined);
});
test("deux colonnes de doses sont distinctes même si leurs valeurs sont égales",()=>{
 const rows=[{"Device Timestamp":"04/08/2026 12:00","Historic Glucose mg/dL":"120","Rapid-Acting Insulin (units)":"3","Long-Acting Insulin (units)":"3"}];
 const r=analyserCSVDetaille(rows,"mg/dL",{separerInjections:true});assert.equal(r.mesures.length,1);assert.equal(r.injections.length,2);assert.equal(r.mesures[0].insuline,undefined);
 const f=fusionnerInjections([],r.injections);assert.equal(f.injections.length,2);assert.equal(resumerInsuline(r.mesures,f.injections).total,6);
 assert.equal(fusionnerInjections(f.injections,r.injections).ajoutees,0);
});
test("la colonne de glycémie secondaire prend le relais uniquement si la première est vide",()=>{
 const r=analyserCSVDetaille([{"Device Timestamp":"04/08/2026 12:00","Historic Glucose mg/dL":"","Scan Glucose mg/dL":"140"}],"mg/dL",{separerInjections:true});assert.equal(r.mesures[0].glycemie,140);
});
test("les débits U/h ne sont jamais traités comme des unités injectées",()=>{
 const r=analyserCSVDetaille([{date:"04/08/2026","Basal rate (U/h)":"1.2"}],"mg/dL",{mapping:{date:"date",insuline:"Basal rate (U/h)"},separerInjections:true});assert.equal(r.injections.length,0);assert.equal(r.lignesRejetees,1);assert.match(r.rejets[0].raison,/débit/);
});
test("l'entête peut être précédé de métadonnées et les titres exacts sont conservés",()=>{
 const rows=[["Export","fictif"],["Date","Glucose","Insuline"],["04/08/2026","120","2"]];assert.equal(choisirEntete(rows),1);assert.equal(detecterColonnes(rows[1]).insuline,"Insuline");
});
test("un réimport ne double pas une ancienne dose associée à une glycémie",()=>{
 const timestamp="2026-08-04T12:00:00.000Z";
 const r=fusionnerInjections([],[{id:"csv",dose:2.5,date:"04/08/2026",timestamp,note:"Import CSV"}],[{id:"old",glycemie:120,insuline:2.5,timestamp,note:"Import CSV"}]);assert.equal(r.ajoutees,0);assert.equal(r.doublons,1);
});
test("les espaces de deux comptes sont distincts et l'ancien historique n'est jamais adopté automatiquement",()=>{
 const data=new Map<string,string>();Object.defineProperty(globalThis,"window",{value:{dispatchEvent(){}},configurable:true});Object.defineProperty(globalThis,"localStorage",{value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)},configurable:true});
 data.set("mesures",JSON.stringify([{id:"legacy",glycemie:111}]));
 activerEspaceCompte("A");assert.equal(lireMesuresLocales().length,0);assert.ok(restaurerDonneesLocales({version:2,mesures:[{glycemie:120}],journal:[],profil:{},injections:[{id:"i",dose:2.5,date:"04/08/2026",timestamp:"2026-08-04T12:00:00Z"}]}));
 activerEspaceCompte("B");assert.equal(lireMesuresLocales().length,0);assert.equal(lireInjectionsLocales().length,0);assert.ok(restaurerDonneesLocales({mesures:[{glycemie:130}],journal:[],profil:{}}));
 activerEspaceCompte("A");assert.equal(lireMesuresLocales()[0].glycemie,120);assert.equal(lireInjectionsLocales()[0].dose,2.5);assert.ok(supprimerDonneesLocales());
 activerEspaceCompte("B");assert.equal(lireMesuresLocales()[0].glycemie,130);assert.equal((sauvegardeHistoriqueNavigateur().mesures[0] as {glycemie:number}).glycemie,111);
});

test("une même colonne ne peut pas être additionnée deux fois",()=>{const r=analyserCSVDetaille([{date:"04/08/2026",dose:"3"}],"mg/dL",{mapping:{date:"date",insuline:"dose",insulineBasale:"dose"},separerInjections:true});assert.equal(r.injections.length,0);assert.equal(r.lignesRejetees,1);});
