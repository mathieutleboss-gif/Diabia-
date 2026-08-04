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
