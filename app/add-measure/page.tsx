"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

export default function AddMeasure() {
  const router = useRouter();
  const [glycemie, setGlycemie] = useState("");
  const [insuline, setInsuline] = useState("");
  const [note, setNote] = useState("");

  function enregistrer() {
    const nouvelleMesure = { glycemie, insuline, note, date: new Date().toLocaleString() };
    const anciennesMesures = JSON.parse(localStorage.getItem("mesures") || "[]");
    localStorage.setItem("mesures", JSON.stringify([...anciennesMesures, nouvelleMesure]));
    alert("Mesure ajoutée !");
    router.push("/dashboard");
  }

  return (
    <PageShell width="max-w-4xl">
      <PageHero eyebrow="Nouvelle donnée" title="Ajouter une mesure" description="Enregistre rapidement une glycémie, l’insuline associée et le contexte utile." />
      <GlassPanel className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <div className="space-y-5">
          <FormField label="Glycémie" hint="mg/dL">
            <input type="number" inputMode="decimal" className={fieldClassName} value={glycemie} onChange={(e) => setGlycemie(e.target.value)} placeholder="120" />
          </FormField>
          <FormField label="Insuline rapide" hint="unités">
            <input type="number" inputMode="decimal" className={fieldClassName} value={insuline} onChange={(e) => setInsuline(e.target.value)} placeholder="4" />
          </FormField>
          <FormField label="Note" hint="facultatif">
            <textarea className={`${fieldClassName} min-h-32 resize-y`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Repas, sport, ressenti…" />
          </FormField>
          <button type="button" onClick={enregistrer} disabled={!glycemie} className={primaryButtonClassName}>Enregistrer la mesure</button>
        </div>
        <aside className="rounded-3xl bg-blue-50 p-6 text-sm leading-6 text-slate-600">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">＋</span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Une donnée mieux contextualisée</h2>
          <p className="mt-2">La note permet de rapprocher plus facilement une variation d’un repas, d’une activité ou d’un événement de la journée.</p>
        </aside>
      </GlassPanel>
    </PageShell>
  );
}
