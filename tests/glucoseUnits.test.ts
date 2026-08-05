import assert from "node:assert/strict";
import test from "node:test";
import { convertirEnMgDl } from "../lib/glucoseUnits";

test("les trois unités de glycémie convergent vers le stockage mg/dL", () => {
  assert.equal(convertirEnMgDl(120, "mg/dL"), 120);
  assert.equal(convertirEnMgDl(1.2, "g/L"), 120);
  assert.equal(convertirEnMgDl(6.7, "mmol/L"), 120.7);
});
