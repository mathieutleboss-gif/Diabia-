"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireMesuresLocales, lireProfilLocal, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { ROUTES } from "../../lib/routes";
import { convertirEnMgDl, exemplePourUnite, type GlucoseUnit } from "../../lib/glucoseUnits";

function valeursDateHeureInitiales() {
  const maintenant = new Date();
  const decalage = maintenant.getTimezoneOffset() * 60_000;
  return {
    date: new Date(maintenant.getTime() - decalage).toISOString().slice(0, 10),
    heure: maintenant.toTimeString().slice(0, 5),
  };
}

export default function AddMeasure() {
  const router = useRouter();
  const initial = valeursDateHeureInitiales();
  const [glycemie, setGlycemie] = useState("");
  const [unite, setUnite] = useState<GlucoseUnit>(() => lireProfilLocal().uniteGlycemie || "mg/dL");
  const [insuline, setInsuline] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(initial.date);
  const [heure, setHeure] = useState(initial.heure);
  const [erreur, setErreur] = useState("");

  function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valeurSaisie = Number(glycemie.replace(",", "."));
    const valeurGlycemie = convertirEnMgDl(valeurSaisie, unite);
    const valeurInsuline = insuline ? Number(insuline) : 0;
    if (!Number.isFinite(valeurGlycemie) || valeurGlycemie <= 0) {
      setErreur("Saisis une glycémie strictement supérieure à zéro.");
      return;
    }
    if (!Number.isFinite(valeurInsuline) || valeurInsuline < 0) {
      setErreur("La quantité d’insuline ne peut pas être négative.");
      return;
    }

    const horodatage = new Date(`${date}T${heure}:00`);
    if (!date || !heure || !Number.isFinite(horodatage.getTime())) {
      setErreur("Choisis une date et une heure valides.");
      return;
    }

    const nouvelleMesure = {
      id: crypto.randomUUID(),
      glycemie: valeurGlycemie,
      insuline,
      note,
      date: horodatage.toLocaleDateString("fr-FR"),
      heure,
      timestamp: horodatage.toISOString(),
    };
    const anciennesMesures = lireMesuresLocales();
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, [...anciennesMesures, nouvelleMesure])) {
      setErreur("La mesure n’a pas pu être enregistrée dans ce navigateur.");
      return;
    }
    setErreur("");
    router.push(ROUTES.dashboard);
  }

  return (
    <PageShell width="max-w-4xl">
      <PageHero eyebrow="Nouvelle donnée" title="Ajouter une mesure" description="Enregistre rapidement une glycémie, l’insuline associée et le contexte utile." />
      <GlassPanel className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <form className="space-y-5" onSubmit={enregistrer}>
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <FormField label="Glycémie" hint={`saisie en ${unite}`}>
              <input type="text" inputMode="decimal" className={fieldClassName} value={glycemie} onChange={(e) => setGlycemie(e.target.value)} placeholder={exemplePourUnite(unite)} autoComplete="off" />
            </FormField>
            <FormField label="Unité">
              <select className={fieldClassName} value={unite} onChange={(event) => setUnite(event.target.value as GlucoseUnit)}>
                <option>mg/dL</option>
                <option>g/L</option>
                <option>mmol/L</option>
              </select>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date">
              <input type="date" required className={fieldClassName} value={date} onChange={(event) => setDate(event.target.value)} />
            </FormField>
            <FormField label="Heure">
              <input type="time" required className={fieldClassName} value={heure} onChange={(event) => setHeure(event.target.value)} />
            </FormField>
          </div>
          <FormField label="Insuline rapide" hint="unités">
            <input type="number" min="0" step="any" inputMode="decimal" className={fieldClassName} value={insuline} onChange={(e) => setInsuline(e.target.value)} placeholder="4" />
          </FormField>
          <FormField label="Note" hint="facultatif">
            <textarea className={`${fieldClassName} min-h-32 resize-y`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Repas, sport, ressenti…" />
          </FormField>
          <button type="submit" disabled={!glycemie || !date || !heure} className={primaryButtonClassName}>Enregistrer la mesure</button>
          {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
        </form>
        <aside className="rounded-3xl bg-blue-50 p-6 text-sm leading-6 text-slate-600">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">＋</span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">Une donnée mieux contextualisée</h2>
          <p className="mt-2">La note permet de rapprocher plus facilement une variation d’un repas, d’une activité ou d’un événement de la journée.</p>
        </aside>
      </GlassPanel>
    </PageShell>
  );
}
