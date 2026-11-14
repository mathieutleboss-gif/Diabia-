import assert from "node:assert/strict";
import test from "node:test";
import { obtenirTimestamp } from "../lib/dates";
import { dateVersChamp, validerHorodatage } from "../lib/saisie";
import { analyserCSVDetaille } from "../lib/csvParser";
import { exporterMesuresCSV, fusionnerMesures } from "../lib/mesures";
import { sauvegardeValide } from "../lib/sauvegarde";

test("les dates ISO prennent en compte l'heure locale séparée comme les dates françaises", () => {
  const iso=obtenirTimestamp({date:"2026-08-04",heure:"14:35"});
  assert.equal(iso,obtenirTimestamp({date:"04/08/2026",heure:"14:35"}));
  assert.equal(new Date(iso!).getHours(),14);
  assert.equal(new Date(iso!).getMinutes(),35);
  assert.equal(dateVersChamp("2026-08-04"),"2026-08-04");
});
test("les dates impossibles, suffixes ambigus et heures hors limites sont refusés", () => {
  for (const date of ["2026-02-30","31/04/2026","04/08/2026 xyz","08-04-2026","2026-13-01"]) assert.equal(obtenirTimestamp({date}),null,date);
  for (const heure of ["24:00","12:60","08:30texte"]) assert.equal(obtenirTimestamp({date:"2026-08-04",heure}),null,heure);
  assert.equal(obtenirTimestamp({timestamp:"2026-02-30T12:00:00Z"}),null);
  assert.equal(obtenirTimestamp({timestamp:"2026-08-04T08:00:00+02:00"}),Date.parse("2026-08-04T06:00:00Z"));
  assert.equal(validerHorodatage("2026-02-30","08:00").date,null);
  assert.equal(validerHorodatage("2099-01-01","08:00").date,null);
});
test("l'import distingue insuline absente, zéro et invalide sans perdre les décimales", () => {
  const resultat=analyserCSVDetaille([
    {glucose:"120",date:"2026-08-04",heure:"14:35"},
    {glucose:"120",date:"2026-08-04",insuline:"0"},
    {glucose:"120",date:"2026-08-04",insuline:"2,25"},
    {glucose:"120",date:"2026-08-04",insuline:"incorrect"},
    {glucose:"120",date:"2026-08-04",insuline:"-2"},
  ]);
  assert.equal(resultat.mesures.length,3);assert.equal(resultat.lignesRejetees,2);
  assert.equal(resultat.mesures[0].insuline,undefined);assert.equal(resultat.mesures[1].insuline,0);assert.equal(resultat.mesures[2].insuline,2.25);
  assert.equal(new Date(resultat.mesures[0].timestamp!).getHours(),14);
});
test("réimporter les mêmes mesures conserve l'historique et ne double pas les doses", () => {
  const initial={id:"old",glycemie:120,insuline:2.5,date:"04/08/2026",heure:"08:00",note:"Repas"};
  const resultat=fusionnerMesures([initial],[{...initial,id:"new"},{...initial,id:"repeat"},{...initial,insuline:3},{...initial,insuline:undefined},{...initial,insuline:0}]);
  assert.equal(resultat.doublons,2);assert.equal(resultat.ajoutees,3);assert.equal(resultat.mesures[0].id,"old");
  assert.equal(fusionnerMesures([{glycemie:120}],[{glycemie:120}]).mesures.length,2);
});
test("l'export CSV conserve zéro, dose vide, guillemets et protège les cellules de formule", () => {
  const csv=exporterMesuresCSV([{glycemie:120,date:"04/08/2026",heure:"08:00",insuline:0,note:'texte;avec "guillemets"'},{glycemie:130,date:"04/08/2026",heure:"09:00",note:"=1+1"}]);
  assert.ok(csv.startsWith("\uFEFFglycémie;date;heure;insuline;note;timestamp;type_insuline\r\n"));
  assert.match(csv,/"0";"texte;avec ""guillemets"""/);
  assert.ok(csv.includes(';"";"\'=1+1"'));
});
test("la validation d'une sauvegarde refuse les versions futures et valeurs invalides", () => {
  const sauvegarde={version:2,mesures:[{glycemie:120,insuline:0,date:"04/08/2026"}],journal:[],profil:{}};
  assert.ok(sauvegardeValide(sauvegarde));
  for (const modif of [{version:999},{profil:[]},{mesures:[{glycemie:"abc"}]},{mesures:[{glycemie:120,insuline:-1}]},{mesures:[{glycemie:120,date:"2026-02-30"}]},{profil:{uniteGlycemie:"inconnue"}}]) assert.equal(sauvegardeValide({...sauvegarde,...modif}),false);
});

test("une sauvegarde d’injections sans identifiant est refusée au lieu de perdre silencieusement la dose",()=>{
  assert.equal(sauvegardeValide({version:3,mesures:[],journal:[],profil:{},injections:[{dose:4,date:'04/08/2026',timestamp:'2026-08-04T08:00:00Z'}]}),false);
});
test("les formules CSV restent neutralisées après des espaces, retours à la ligne ou un BOM",()=>{
  for(const note of ['  =HYPERLINK("x")','\n+SUM(1;1)','\uFEFF@SUM(1;1)',' \t-CMD()','＝1+1']){
    const csv=exporterMesuresCSV([{glycemie:120,note}]);assert.ok(csv.includes(`"'${note.replace(/"/g,'""')}"`),JSON.stringify(note));
  }
});
