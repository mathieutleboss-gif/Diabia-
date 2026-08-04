"use client";

import { useState } from "react";
import { analyserGlycemie } from "../../lib/analyse";
import { creerRapportIA } from "../../lib/analyses/rapportIA";
import { GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireJournalLocal, lireMesuresLocales, lireProfilLocal } from "../../lib/storage";
import { ROUTES } from "../../lib/routes";

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function envoyer() {
    if (!question.trim()) return;
    setChargement(true);
    setErreur("");
    try {
      const mesures = lireMesuresLocales();
      const profil = lireProfilLocal();
      const journal = lireJournalLocal();
      const rapport = creerRapportIA(analyserGlycemie(mesures, journal), profil, journal);
      const resultat = await fetch(ROUTES.apiAssistant, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, rapport }),
      });
      const data = (await resultat.json()) as { reponse?: string; error?: string };
      if (!resultat.ok || !data.reponse) throw new Error(data.error || "Réponse indisponible.");
      setReponse(data.reponse);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Impossible de contacter Diabia.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="IA locale · Ollama" title="Assistant Diabia" description="Pose une question sur tes résultats. L’assistant s’appuie uniquement sur les données présentes dans ton navigateur." />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
        <GlassPanel>
          <label htmlFor="question-assistant" className="text-sm font-semibold text-slate-800">
            Question pour Diabia
          </label>
          <textarea
            id="question-assistant"
            maxLength={1000}
            className={`${fieldClassName} mt-2 min-h-40 resize-y text-base`}
            placeholder="Pourquoi mon score est-il bas ? Quelles périodes semblent les plus difficiles ?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <p className="mt-2 text-right text-xs text-slate-400">{question.length} / 1 000</p>
          <button type="button" onClick={envoyer} disabled={chargement || !question.trim()} className={`mt-4 ${primaryButtonClassName}`}>{chargement ? "Analyse en cours…" : "Demander à Diabia"}</button>
          {erreur && <div role="alert" className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{erreur}</div>}
          {reponse && <div aria-live="polite" className="mt-6 rounded-3xl bg-blue-50/80 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Réponse</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{reponse}</p></div>}
        </GlassPanel>
        <aside className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-white/10 text-2xl">✦</span>
          <h2 className="mt-6 text-xl font-semibold">Une lecture prudente</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Diabia explique les tendances calculées par l’application. Il ne remplace pas un professionnel de santé et ne modifie jamais un traitement.</p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-400">Ollama doit être lancé sur ce Mac avec le modèle configuré pour Diabia.</div>
        </aside>
      </div>
    </PageShell>
  );
}
