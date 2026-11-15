import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {alimentsCiqual,ciqualSource,etatAliment} from '../lib/nutrition/ciqual';
import {glucides,poidsEnGrammes} from '../lib/nutrition/core';
test('le catalogue contient les 3484 aliments Ciqual et respecte les données sources',()=>{
 assert.equal(alimentsCiqual.length,3484);assert.equal(new Set(alimentsCiqual.map(f=>f.id)).size,3484);
 for(const f of alimentsCiqual){assert.ok(f.nom&&f.source==='ANSES — Table Ciqual 2025');if(f.glucidesPour100g!==null){assert.equal(f.glucidesPour100g,Number(f.valeurSource?.replace(',','.')));assert.ok(f.glucidesPour100g>=0&&f.glucidesPour100g<=100);}else assert.equal(glucides(f,100),null);}
 assert.equal(alimentsCiqual.filter(f=>f.glucidesPour100g===null).length,212);
});
test('recherche réelle : aliments courants, accents, pluriels et aucun résultat',async()=>{
 for(const q of ['riz','pâtes','pomme','banane','pain'])assert.ok((await ciqualSource.rechercher(q)).length>1,q);
 assert.deepEqual(await ciqualSource.rechercher('pâtes'),await ciqualSource.rechercher('pates'));
 assert.deepEqual(await ciqualSource.rechercher('zzzintrouvable'),[]);assert.deepEqual(await ciqualSource.rechercher(''),[]);assert.deepEqual(await ciqualSource.rechercher('a'.repeat(101)),[]);
 assert.equal(await ciqualSource.barcode('0000000000000'),null);
});
test('riz cru et cuit utilisent leurs propres valeurs officielles, pas les sucres',()=>{
 const raw=alimentsCiqual.find(f=>f.id==='ciqual:9100')!,cooked=alimentsCiqual.find(f=>f.id==='ciqual:9104')!;
 assert.equal(raw.etat,'Cru');assert.equal(cooked.etat,'Cuit');assert.equal(raw.glucidesPour100g,77.5);assert.equal(cooked.glucidesPour100g,33.2);
 assert.equal(glucides(cooked,100),33.2);assert.equal(glucides(cooked,150),49.8);assert.equal(glucides(cooked,50),16.6);assert.equal(glucides(raw,150),116.25);
 assert.equal(etatAliment('Crustacé'),'Voir le libellé');
 assert.equal(etatAliment('Légumes crus et cuits'),'Préparation mixte : voir le libellé');
});
test('poids : décimales françaises et refus des valeurs vides, négatives, excessives ou ambiguës',()=>{
 assert.equal(poidsEnGrammes('150,5'),150.5);assert.equal(poidsEnGrammes('150.5'),150.5);assert.equal(poidsEnGrammes('2000'),2000);
 for(const q of ['', ' ', '-1', '0', '2000.1', 'NaN','Infinity','1e3','150g','1,2,3'])assert.equal(poidsEnGrammes(q),null,q);
 const food=alimentsCiqual.find(f=>f.id==='ciqual:9104')!;for(const n of [-1,0,2001,Infinity,NaN])assert.equal(glucides(food,n),null);
 assert.equal(glucides({...food,glucidesPour100g:null},150),null);assert.equal(glucides({...food,glucidesPour100g:101},150),null);
});
