import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),Papa=require('papaparse');
const {analyserCSVDetaille}=require('../.test-dist/lib/csvParser.js'),{exporterInjectionsCSV,fusionnerInjections}=require('../.test-dist/lib/mesures.js');
test('un export d’injections réimporté conserve l’instant précis, les doses et le type',()=>{
 const original=[{id:'test',dose:2.25,type:'basale',date:'04/08/2026',heure:'12:00',timestamp:'2026-08-04T12:00:01.123Z',note:'texte; avec "guillemets"'}];
 const rows=Papa.parse(exporterInjectionsCSV(original),{header:true,delimiter:';',skipEmptyLines:true}).data;
 const r=analyserCSVDetaille(rows,'mg/dL',{separerInjections:true});assert.equal(r.lignesRejetees,0);assert.equal(r.mesures.length,0);assert.equal(r.injections[0].dose,2.25);assert.equal(r.injections[0].timestamp,original[0].timestamp);assert.equal(r.injections[0].type,'basale');assert.equal(fusionnerInjections(original,r.injections).ajoutees,0);
});
test('le fichier fictif téléchargeable contient des glycémies et des doses séparées',()=>{
 const rows=Papa.parse(readFileSync('public/examples/diabia-exemple.csv','utf8'),{header:true,delimiter:';',skipEmptyLines:true}).data;
 const r=analyserCSVDetaille(rows,'mg/dL',{separerInjections:true});assert.equal(r.mesures.length,2);assert.equal(r.injections.length,3);assert.equal(r.injections.reduce((s,i)=>s+i.dose,0),14.5);
});

test('l’export combiné conserve les millisecondes et le type d’insuline au réimport',()=>{
 const {exporterMesuresCSV}=require('../.test-dist/lib/mesures.js');
 const mesure={id:'m',glycemie:120.5,timestamp:'2026-08-04T08:00:00.123Z',date:'04/08/2026',heure:'08:00',note:'exemple'};
 const injection={id:'i',dose:2.25,type:'basale',date:'04/08/2026',heure:'08:00',timestamp:'2026-08-04T08:00:00.456Z',note:'exemple'};
 const rows=Papa.parse(exporterMesuresCSV([mesure],[injection]),{header:true,delimiter:';',skipEmptyLines:true}).data;
 const result=analyserCSVDetaille(rows,'mg/dL',{separerInjections:true});assert.equal(result.lignesRejetees,0);assert.equal(result.mesures[0].timestamp,mesure.timestamp);assert.equal(result.injections[0].timestamp,injection.timestamp);assert.equal(result.injections[0].type,'basale');
});
test('les titres dupliqués ne perdent pas de colonnes quand des suffixes existent déjà',()=>{
 const {nommerColonnesCSV}=require('../.test-dist/lib/csvParser.js');
 const columns=nommerColonnesCSV(['glucose','glucose','glucose (2)','','Colonne 4']);assert.equal(new Set(columns).size,5);
 const row=Object.fromEntries(columns.map((name,i)=>[name,i]));assert.equal(Object.keys(row).length,5);
});
