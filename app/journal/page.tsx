"use client";

import { useState } from "react";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireJournalLocal, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";

export default function Journal() {
  const [type, setType] = useState("Repas");
  const [description, setDescription] = useState("");
  const [heure, setHeure] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  function ajouter() {
    const ancien = lireJournalLocal();
    const maintenant = new Date();
    const nouveau = {
      type,
      description,
      heure,
      date: maintenant.toLocaleDateString(),
      timestamp: maintenant.toISOString(),
    };
    if (!sauvegarderLocal(STORAGE_KEYS.journal, [...ancien, nouveau])) {
      setErreur("L’événement n’a pas pu être enregistré dans ce navigateur.");
      setSucces("");
      return;
    }
    setErreur("");
    setDescription("");
    setSucces("Événement ajouté au journal.");
  }

  return (
    <PageShell width="max-w-4xl">
      <PageHero eyebrow="Contexte" title="Journal Diabia" description="Note les événements importants pour enrichir la lecture de tes variations." />
      <GlassPanel className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Type d’événement"><select className={fieldClassName} value={type} onChange={(e) => setType(e.target.value)}><option>Repas</option><option>Insuline</option><option>Activité</option></select></FormField>
          <FormField label="Heure"><input type="time" className={fieldClassName} value={heure} onChange={(e) => setHeure(e.target.value)} /></FormField>
        </div>
        <FormField label="Description"><textarea className={`${fieldClassName} min-h-36 resize-y`} placeholder="Pizza, marche, injection…" value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
        <button type="button" onClick={ajouter} disabled={!description} className={primaryButtonClassName}>Ajouter au journal</button>
        {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
        {succes && <p role="status" className="text-sm font-medium text-emerald-700">{succes}</p>}
      </GlassPanel>
    </PageShell>
  );
}
