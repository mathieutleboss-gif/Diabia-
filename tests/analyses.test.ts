import assert from "node:assert/strict";
import test from "node:test";
import { analyserGlycemie } from "../lib/analyse";
import { obtenirTimestamp } from "../lib/dates";

test("le score est indisponible sans mesure valide", () => {
  const analyse = analyserGlycemie([], []);

  assert.equal(analyse.nombreMesures, 0);
  assert.equal(analyse.score, null);
});

test("les règles existantes du score restent inchangées", () => {
  assert.equal(analyserGlycemie([{ glycemie: 100 }], []).score, 100);
  assert.equal(analyserGlycemie([{ glycemie: 200 }], []).score, 30);
  assert.equal(analyserGlycemie([{ glycemie: 60 }], []).score, 0);
});

test("les bornes 70 et 180 restent incluses dans la cible", () => {
  const analyse = analyserGlycemie(
    [{ glycemie: 69 }, { glycemie: 70 }, { glycemie: 180 }, { glycemie: 181 }],
    []
  );

  assert.equal(analyse.cible, 50);
  assert.equal(analyse.hypo, 25);
  assert.equal(analyse.hyper, 25);
});

test("une variation de 50 mg/dL est détectée, une variation de 49 ne l’est pas", () => {
  const analyse = analyserGlycemie(
    [{ glycemie: 100 }, { glycemie: 149 }, { glycemie: 199 }],
    []
  );

  assert.equal(analyse.variations.nombre, 1);
  assert.equal(analyse.variations.variations?.[0]?.difference, 50);
});

test("les mesures invalides ne contaminent pas les statistiques", () => {
  const analyse = analyserGlycemie(
    [{ glycemie: "incorrect" }, { glycemie: "" }, { glycemie: 120 }],
    []
  );

  assert.equal(analyse.nombreMesures, 1);
  assert.equal(analyse.moyenne, 120);
  assert.equal(analyse.score, 100);
});

test("les variations suivent l’ordre chronologique quand toutes les dates sont connues", () => {
  const analyse = analyserGlycemie(
    [
      { glycemie: 200, timestamp: "2026-08-04T12:00:00.000Z" },
      { glycemie: 100, timestamp: "2026-08-04T08:00:00.000Z" },
    ],
    []
  );

  assert.equal(analyse.variations.variations?.[0]?.avant, 100);
  assert.equal(analyse.variations.variations?.[0]?.apres, 200);
});

test("l’analyse du journal exclut les mesures d’un autre jour", () => {
  const analyse = analyserGlycemie(
    [
      {
        glycemie: 220,
        date: "05/08/2026",
        heure: "13:00",
      },
    ],
    [
      {
        type: "Repas",
        description: "Déjeuner",
        date: "04/08/2026",
        heure: "12:00",
      },
    ]
  );

  assert.doesNotMatch(analyse.journal.message, /hausse de glycémie/);
});

test("l’analyse du journal conserve une corrélation du même jour", () => {
  const analyse = analyserGlycemie(
    [{ glycemie: 220, date: "04/08/2026", heure: "13:00" }],
    [{ type: "Repas", description: "Déjeuner", date: "04/08/2026", heure: "12:00" }]
  );

  assert.match(analyse.journal.message, /hausse de glycémie/);
});

test("les dates calendaires impossibles sont rejetées", () => {
  assert.equal(obtenirTimestamp({ date: "31/02/2026", heure: "12:00" }), null);
});
