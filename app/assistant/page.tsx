"use client";

import { useEffect, useState } from "react";
import { GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { ROUTES } from "../../lib/routes";

export default function Assistant() {
  const [questionId, setQuestionId] = useState("moyenne");
  const [disponible,setDisponible] = useState(false);
  const [verification,setVerification] = useState(true);
  useEffect(()=>{const c=new AbortController();fetch('/api/assistant',{cache:'no-store',credentials:'same-origin',signal:c.signal}).then(async r=>{if(r.ok){const d=await r.json();if(!c.signal.aborted)setDisponible(d.disponible===true);}}).catch(()=>{}).finally(()=>{if(!c.signal.aborted)setVerification(false);});return()=>c.abort();},[]);
  const [chargement, setChargement] = useState(false);
  const [reponse, setReponse] = useState("");
  const [erreur, setErreur] = useState("");
  async function envoyer(event: React.FormEvent) {
    event.preventDefault(); setChargement(true); setErreur(""); setReponse("");
    try {
      const response = await fetch(ROUTES.apiAssistant, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Réponse indisponible.");
      setReponse(data.reponse);
    } catch (error) { setErreur(error instanceof Error ? error.message : "Assistant indisponible."); }
    finally { setChargement(false); }
  }
  return <PageShell width="max-w-3xl">
    <PageHero eyebrow="Groq · Démonstration" title="Assistant Diabia" description="Teste une IA distante sur des exemples de statistiques entièrement fictifs." />
    <GlassPanel>
      <p role="status" className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{verification ? "Vérification de la configuration…" : disponible ? "Démonstration configurée. Une connexion par compte est nécessaire." : "Démonstration désactivée : le compte API gratuit et ses quotas restent à configurer."}</p>
      <p className="mb-5 text-sm leading-6 text-slate-600">Tes mesures, ton profil et ton journal restent dans ce navigateur et ne sont pas envoyés à Groq. L’analyse de données de santé réelles attend la validation du cadre juridique et de l’hébergement.</p>
      <form onSubmit={envoyer}>
        <label htmlFor="question" className="font-semibold">Exemple à explorer</label>
        <select id="question" value={questionId} onChange={e => setQuestionId(e.target.value)} className={`${fieldClassName} mt-2`}>
          <option value="moyenne">Calculer une moyenne sur trois nombres fictifs</option>
          <option value="dispersion">Comprendre leur dispersion</option>
          <option value="limites">Comprendre les limites d’un petit échantillon</option>
        </select>
        <p className="my-4 text-sm text-slate-500">Maximum : 10 demandes sur 24 heures et 2 par minute par compte. Un plafond global peut suspendre les demandes plus tôt.</p>
        <button disabled={!disponible || chargement} className={primaryButtonClassName}>{chargement ? "Réponse en cours…" : "Tester l’exemple"}</button>
      </form>
      {erreur && <p role="alert" className="mt-5 text-rose-800">{erreur}</p>}
      {reponse && <div aria-live="polite" className="mt-5 whitespace-pre-wrap rounded-2xl bg-blue-50 p-5 text-sm leading-7">{reponse}</div>}
    </GlassPanel>
  </PageShell>;
}
