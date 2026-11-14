import assert from "node:assert/strict";
import test from "node:test";
import { lireDoseInsuline, resumerInsuline } from "../lib/insuline";

test("une dose manquante reste distincte de zéro et les décimales françaises sont conservées", () => {
  for (const dose of [undefined, "", " ", "abc", -1, NaN, Infinity, 501]) assert.equal(lireDoseInsuline(dose), null);
  assert.equal(lireDoseInsuline(0), 0);
  assert.equal(lireDoseInsuline("0"), 0);
  assert.equal(lireDoseInsuline(" 2,5 "), 2.5);
});

test("le total ne compte que les doses valides et la dernière dose suit les dates", () => {
  const resume = resumerInsuline([
    { id:"recent", glycemie:120, insuline:"2,5", date:"12/11/2026", heure:"12:00" },
    { id:"ancien", glycemie:120, insuline:4, date:"11/11/2026", heure:"08:00" },
    { id:"zero", glycemie:120, insuline:0, date:"12/11/2026", heure:"18:00" },
    { glycemie:120, insuline:"" },
    { glycemie:120, insuline:-2 },
    { glycemie:120, insuline:1.5 },
  ]);
  assert.equal(resume.total,8);
  assert.equal(resume.renseignees,4);
  assert.equal(resume.manquantes,2);
  assert.equal(resume.injections.length,3);
  assert.equal(resume.injections[0].id,"recent");
  assert.equal(resume.jours.length,2);
  assert.equal(resume.jours[1].total,2.5);
  assert.equal(resume.jours[1].saisies,2);
});

test("un historique sans doses n'affiche aucun total connu ni jour inventé", () => {
  const resume = resumerInsuline([{glycemie:120,date:"12/11/2026"}]);
  assert.equal(resume.renseignees,0);
  assert.equal(resume.manquantes,1);
  assert.deepEqual(resume.jours,[]);
  assert.deepEqual(resume.injections,[]);
});
