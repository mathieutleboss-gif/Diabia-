import assert from "node:assert/strict";
import test from "node:test";
import { analyserCSV } from "../lib/csvParser";

test("le parseur conserve uniquement les lignes glycémiques valides", () => {
  const mesures = analyserCSV([
    { glucose: "135", date: "04/08/2026" },
    { glucose: "incorrect" },
    { glucose: "-10" },
    { note: "sans glycémie" },
  ]);

  assert.equal(mesures.length, 1);
  assert.equal(mesures[0].glycemie, 135);
  assert.ok(mesures[0].timestamp);
  const date = new Date(mesures[0].timestamp);
  assert.deepEqual(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    [2026, 8, 4]
  );
});

test("le parseur reconnaît les accents, l’heure et convertit les mmol/L", () => {
  const mesures = analyserCSV([
    { "Glycémie": "6,7", Date: "04/08/2026", Heure: "14:35", Insuline: "3" },
  ], "mmol/L");

  assert.equal(mesures.length, 1);
  assert.equal(mesures[0].glycemie, 120.7);
  assert.equal(mesures[0].heure, "14:35");
  assert.equal(mesures[0].insuline, 3);
});

test("le parseur rejette une ligne sans date au lieu d’inventer la date du jour", () => {
  assert.equal(analyserCSV([{ glucose: "120" }]).length, 0);
});
