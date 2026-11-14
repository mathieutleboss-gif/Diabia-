import assert from "node:assert/strict";
import test from "node:test";
import { analyserGlycemie } from "../lib/analyse";
import { obtenirTimestamp } from "../lib/dates";
import { creerPromptDiabia } from "../lib/ia/promptDiabia";
import type { JournalEntry, Mesure } from "../lib/analyses/types";

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

test("une mesure sans date n’empêche plus le tri des mesures datées", () => {
  const analyse = analyserGlycemie([
    { glycemie: 200, timestamp: "2026-08-04T12:00:00.000Z" },
    { glycemie: 150, date: "date invalide" },
    { glycemie: 100, timestamp: "2026-08-04T08:00:00.000Z" },
  ], []);
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

test("l’analyse du journal respecte précisément la fenêtre de zéro à trois heures", () => {
  const journal = [{ type: "Repas", description: "Déjeuner", date: "04/08/2026", heure: "12:45" }];
  const avant = analyserGlycemie([{ glycemie: 220, date: "04/08/2026", heure: "12:30" }], journal);
  const apresFenetre = analyserGlycemie([{ glycemie: 220, date: "04/08/2026", heure: "15:46" }], journal);
  const dansFenetre = analyserGlycemie([{ glycemie: 220, date: "04/08/2026", heure: "15:45" }], journal);

  assert.doesNotMatch(avant.journal.message, /hausse de glycémie/);
  assert.doesNotMatch(apresFenetre.journal.message, /hausse de glycémie/);
  assert.match(dansFenetre.journal.message, /hausse de glycémie/);
});

test("les dates calendaires impossibles sont rejetées", () => {
  assert.equal(obtenirTimestamp({ date: "31/02/2026", heure: "12:00" }), null);
});

function mesure(date: string, glycemie: number): Mesure {
  return { glycemie, timestamp: date, date: new Date(date).toLocaleDateString("fr-FR"), heure: date.slice(11, 16) };
}

test("un petit échantillon reste explicitement exploratoire", () => {
  const analyse = analyserGlycemie([mesure("2026-08-04T08:00:00.000Z", 120)], []);
  assert.equal(analyse.score, 100);
  assert.equal(analyse.avance.qualite.niveau, "faible");
  assert.equal(analyse.avance.pointsPositifs.length, 0);
  assert.match(analyse.avance.resumeGeneral, /exploratoire/);
  assert.match(analyse.explication.problemes.join(" "), /insuffisant/);
});

test("une amélioration entre deux fenêtres de sept jours est détectée avec prudence", () => {
  const mesures: Mesure[] = [];
  const reference = Date.parse("2026-08-01T12:00:00.000Z");
  for (let index = 0; index < 12; index += 1) {
    mesures.push(mesure(new Date(reference - index * 12 * 60 * 60 * 1_000).toISOString(), 120));
    mesures.push(mesure(new Date(reference - (8 * 24 + index * 12) * 60 * 60 * 1_000).toISOString(), 220));
  }
  const analyse = analyserGlycemie(mesures, []);
  const comparaison = analyse.avance.comparaisons.find(({ periode }) => periode === "7j");
  assert.ok(comparaison);
  assert.ok((comparaison.variationCible ?? 0) >= 50);
  assert.match(comparaison.interpretation, /Amélioration/);
  assert.ok(analyse.avance.tendances.some(({ titre }) => /Amélioration/.test(titre)));
});

test("les repas ne deviennent une cause probable qu'après plusieurs associations mesurées", () => {
  const mesures: Mesure[] = [];
  const journal: JournalEntry[] = [];
  for (let jour = 1; jour <= 5; jour += 1) {
    const prefixe = `2026-07-${String(jour).padStart(2, "0")}`;
    mesures.push(mesure(`${prefixe}T11:00:00.000Z`, 105));
    mesures.push(mesure(`${prefixe}T13:00:00.000Z`, 195));
    journal.push({ type: "Repas", description: "Déjeuner documenté", timestamp: `${prefixe}T12:00:00.000Z` });
  }
  const analyse = analyserGlycemie(mesures, journal);
  const correlation = analyse.avance.correlations.find(({ typeEvenement }) => typeEvenement === "Repas");
  assert.ok(correlation);
  assert.equal(correlation.confiance, "élevé");
  assert.equal(correlation.differenceMoyenne, 90);
  assert.ok(analyse.avance.causesProbables.some(({ titre }) => /Repas/.test(titre)));
  assert.match(correlation.conclusion, /sans preuve de causalité/);
});

test("les valeurs très basses et très hautes produisent des alertes de sécurité distinctes", () => {
  const analyse = analyserGlycemie([
    mesure("2026-08-01T08:00:00.000Z", 49),
    mesure("2026-08-01T12:00:00.000Z", 280),
  ], []);
  assert.ok(analyse.avance.alertesSecurite.some(({ niveau, titre }) => niveau === "urgente" && titre.includes("54")));
  assert.ok(analyse.avance.alertesSecurite.some(({ titre }) => titre.includes("250")));
});

test("le prompt impose les dix sections, la prudence et la séparation des données", () => {
  const prompt = creerPromptDiabia("Pourquoi ?", { analyseAvancee: { qualite: { niveau: "faible" } } });
  for (let section = 1; section <= 10; section += 1) assert.match(prompt, new RegExp(`## ${section}\\.`));
  assert.match(prompt, /DONNÉES_NON_FIABLES/);
  assert.match(prompt, /ne poses aucun diagnostic/i);
  assert.match(prompt, /Confiance : faible\|modérée\|élevée/);
});

test("une baisse de moyenne vers des valeurs basses ne devient pas une amélioration médicale",()=>{
 const rapport=analyserGlycemie([{glycemie:120},{glycemie:120},{glycemie:55},{glycemie:55}],[]);
 assert.equal(rapport.tendance.difference,-65);
 assert.doesNotMatch(rapport.tendance.message,/détecte une amélioration/);
 assert.match(rapport.tendance.message,/ne suffit pas/);
});
test("les horaires exploitent le timestamp et ignorent une heure invalide au lieu de la classer la nuit",()=>{
 const instant=new Date(2026,6,1,18,30).toISOString();
 const rapport=analyserGlycemie([{glycemie:220,timestamp:instant},{glycemie:220,heure:"24:99"}],[]);
 assert.equal(rapport.horaires.soir,1);assert.equal(rapport.horaires.nuit,0);
});
test("dupliquer un événement du journal ne fabrique pas plusieurs associations indépendantes",()=>{
 const m=[mesure("2026-07-01T11:00:00.000Z",105),mesure("2026-07-01T13:00:00.000Z",195)];
 const event={type:"Repas",description:"Déjeuner",timestamp:"2026-07-01T12:00:00.000Z"};
 const correlation=analyserGlycemie(m,Array.from({length:10},()=>({...event}))).avance.correlations[0];
 assert.equal(correlation.nombreEvenements,10);assert.equal(correlation.evenementsExploitables,1);assert.equal(correlation.joursCouverts,1);assert.equal(correlation.confiance,"faible");
});
test("un historique volumineux conserve ses extrema sans dépasser la limite d’arguments JavaScript",()=>{
 const rows=Array.from({length:130000},(_,i)=>({glycemie:i%2?49:280,timestamp:"2026-07-01T12:00:00.000Z"}));
 const rapport=analyserGlycemie(rows,[]);const stats=rapport.avance.statistiquesPeriodes.find(s=>s.cle==='historique');
 assert.equal(stats?.minimum,49);assert.equal(stats?.maximum,280);assert.equal(rapport.avance.alertesSecurite.length,2);
});
