"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireMesuresLocales, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { ROUTES } from "../../lib/routes";

export default function AddMeasure() {
  const router = useRouter();
  const [glycemie, setGlycemie] = useState("");
  const [insuline, setInsuline] = useState("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  function enregistrer() {
    const valeurGlycemie = Number(glycemie);
    const valeurInsuline = insuline ? Number(insuline) : 0;
    if (!Number.isFinite(valeurGlycemie) || valeurGlycemie <= 0) {
      setErreur("Saisis une glycémie strictement supérieure à zéro.");
      setSucces("");
      return;
    }
    if (!Number.isFinite(valeurInsuline) || valeurInsuline < 0) {
      setErreur("La quantité d’insuline ne peut pas être négative.");
      setSucces("");
      return;
    }

    const maintenant = new Date();
    const nouvelleMesure = {
      glycemie,
      insuline,
      note,
      date: maintenant.toLocaleString(),
      timestamp: maintenant.toISOString(),
    };
    const anciennesMesures = lireMesuresLocales();
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, [...anciennesMesures, nouvelleMesure])) {
      setErreur("La mesure n’a pas pu être enregistrée dans ce navigateur.");
      setSucces("");
      return;
    }
    setErreur("");
    setSucces("Mesure enregistrée. Redirection vers le tableau de bord…");
    router.push(ROUTES.dashboard);
  }

  return (
    <PageShell width="max-w-4xl">
      <PageHero eyebrow="Nouvelle donnée" title="Ajouter une mesure" description="Enregistre rapidement une glycémie, l’insuline associée et le contexte utile." />
      <GlassPanel className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <div className="space-y-5">
          <FormField label="Glycémie" hint="mg/dL">
            <input type="number" min="0.1" step="any" inputMode="decimal" className={fieldClassName} value={glycemie} onChange={(e) => setGlycemie(e.target.value)} placeholder="120" />
          </FormField>
          <FormField label="Insuline rapide" hint="unités">
            <input type="number" min="0" step="any" inputMode="decimal" className={fieldClassName} value={insuline} onChange={(e) => setInsuline(e.target.value)} placeholder="4" />
          </FormField>
          <FormField label="Note" hint="facultatif">
            <textarea className={`${fieldClassName} min-h-32 resize-y`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Repas, sport, ressenti…" />
          </FormField>
          <button type="button" onClick={enregistrer} disabled={!glycemie} className={primaryButtonClassName}>Enregistrer la mesure</button>
          {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
          {succes && <p role="status" className="text-sm font-medium text-emerald-700">{succes}</p>}
        </div>
        <aside className="rounded-3xl bg-blue-50 p-6 text-sm leading-6 text-slate-600">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">＋</span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Une donnée mieux contextualisée</h2>
          <p className="mt-2">La note permet de rapprocher plus facilement une variation d’un repas, d’une activité ou d’un événement de la journée.</p>
        </aside>
      </GlassPanel>
    </PageShell>
  );
}
