"use client";

import { useState } from "react";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

export default function Journal() {
  const [type, setType] = useState("Repas");
  const [description, setDescription] = useState("");
  const [heure, setHeure] = useState("");

  function ajouter() {
    const ancien = JSON.parse(localStorage.getItem("journal") || "[]");
    const nouveau = { type, description, heure, date: new Date().toLocaleDateString() };
    localStorage.setItem("journal", JSON.stringify([...ancien, nouveau]));
    setDescription("");
    alert("Événement ajouté !");
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
      </GlassPanel>
    </PageShell>
  );
}
