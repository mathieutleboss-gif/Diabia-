"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { analyserGlycemie } from "../../lib/analyse";
import { creerRapportIA } from "../../lib/analyses/rapportIA";
import { GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireJournalLocal, lireMesuresLocales, lireProfilLocal, lireValeurLocale } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserMesures } from "../../lib/validation";
import { ROUTES } from "../../lib/routes";

type EtatOllama = { statut: "verification" | "pret" | "indisponible" | "modele-manquant"; modele: string };

export default function Assistant() {
  const snapshot = useSyncExternalStore(
    (callback) => { window.addEventListener("storage", callback); window.addEventListener("diabia:storage", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("diabia:storage", callback); }; },
    () => lireValeurLocale(STORAGE_KEYS.mesures, "[]"),
    () => "[]"
  );
  const hasData = useMemo(() => { try { return normaliserMesures(JSON.parse(snapshot)).length > 0; } catch { return false; } }, [snapshot]);
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [ollama, setOllama] = useState<EtatOllama>({ statut: "verification", modele: "" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(ROUTES.apiAssistant, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { disponible?: boolean; modelDisponible?: boolean; modele?: string }) => setOllama({ statut: !data.disponible ? "indisponible" : data.modelDisponible ? "pret" : "modele-manquant", modele: data.modele || "llama3.2:3b" }))
      .catch((error: unknown) => { if (error instanceof Error && error.name !== "AbortError") setOllama({ statut: "indisponible", modele: "llama3.2:3b" }); });
    return () => controller.abort();
  }, []);

  async function envoyer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !hasData || ollama.statut !== "pret") return;
    setChargement(true); setErreur("");
    try {
      const mesures = lireMesuresLocales();
      const profil = lireProfilLocal();
      const journal = lireJournalLocal();
      const rapport = creerRapportIA(analyserGlycemie(mesures, journal), profil, journal, mesures);
      const resultat = await fetch(ROUTES.apiAssistant, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, rapport }) });
      const data = (await resultat.json()) as { reponse?: string; error?: string };
      if (!resultat.ok || !data.reponse) throw new Error(data.error || "Réponse indisponible.");
      setReponse(data.reponse);
    } catch (error) { setErreur(error instanceof Error ? error.message : "Impossible de contacter Diabia."); }
    finally { setChargement(false); }
  }

  const etatTexte = ollama.statut === "verification" ? "Vérification d’Ollama…" : ollama.statut === "pret" ? `Ollama prêt · ${ollama.modele}` : ollama.statut === "modele-manquant" ? `Modèle ${ollama.modele} non installé` : "Ollama n’est pas joignable";

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="IA locale · Ollama" title="Assistant Diabia" description="Pose une question sur tes résultats. L’assistant s’appuie uniquement sur les données présentes dans ce navigateur." />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
        <GlassPanel>
          <div role="status" className={`mb-5 rounded-2xl px-4 py-3 text-sm font-medium ${ollama.statut === "pret" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{etatTexte}</div>
          {!hasData ? <div className="rounded-3xl bg-blue-50 p-6"><h2 className="font-semibold text-slate-950">Ajoute d’abord des mesures</h2><p className="mt-2 text-sm text-slate-600">L’assistant a besoin de données réelles pour répondre sans inventer.</p><div className="mt-4 flex gap-3"><Link href={ROUTES.ajoutMesure} className={primaryButtonClassName}>Ajouter une mesure</Link><Link href={ROUTES.import} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700">Importer</Link></div></div> : <form onSubmit={envoyer}><label htmlFor="question-assistant" className="text-sm font-semibold text-slate-800">Question pour Diabia</label><textarea id="question-assistant" maxLength={1000} className={`${fieldClassName} mt-2 min-h-40 resize-y text-base`} placeholder="Pourquoi mon score est-il bas ?" value={question} onChange={(e) => setQuestion(e.target.value)} /><p className="mt-2 text-right text-xs text-slate-400">{question.length} / 1 000</p><button type="submit" disabled={chargement || !question.trim() || ollama.statut !== "pret"} className={`mt-4 ${primaryButtonClassName}`}>{chargement ? "Analyse en cours…" : "Demander à Diabia"}</button></form>}
          {erreur && <div role="alert" className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{erreur}</div>}
          {reponse && <div aria-live="polite" className="mt-6 rounded-3xl bg-blue-50/80 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Réponse</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{reponse}</p></div>}
        </GlassPanel>
        <aside className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl"><span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-white/10 text-2xl">✦</span><h2 className="mt-6 text-xl font-semibold">Configuration locale</h2><p className="mt-3 text-sm leading-6 text-slate-300">Sur la machine qui exécute Diabia : lance <code className="rounded bg-white/10 px-1.5 py-0.5">ollama serve</code>, puis <code className="rounded bg-white/10 px-1.5 py-0.5">ollama pull {ollama.modele || "llama3.2:3b"}</code>.</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-400">En déploiement distant, « localhost » désigne le serveur hébergeant Diabia, pas ton Mac. Configure OLLAMA_URL sur ce serveur.</div></aside>
      </div>
    </PageShell>
  );
}
