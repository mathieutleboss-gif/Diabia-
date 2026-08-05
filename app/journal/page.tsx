"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { JournalEntry } from "../../lib/analyses/types";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";
import { lireJournalLocal, lireValeurLocale, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserJournal } from "../../lib/validation";

function maintenantLocal() {
  const date = new Date();
  const decalage = date.getTimezoneOffset() * 60_000;
  return { date: new Date(date.getTime() - decalage).toISOString().slice(0, 10), heure: date.toTimeString().slice(0, 5) };
}

export default function Journal() {
  const initial = maintenantLocal();
  const snapshot = useSyncExternalStore(
    (callback) => { window.addEventListener("storage", callback); window.addEventListener("diabia:storage", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("diabia:storage", callback); }; },
    () => lireValeurLocale(STORAGE_KEYS.journal, "[]"),
    () => "[]"
  );
  const entrees = useMemo(() => {
    try { return normaliserJournal(JSON.parse(snapshot)).reverse(); }
    catch { return []; }
  }, [snapshot]);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [type, setType] = useState("Repas");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initial.date);
  const [heure, setHeure] = useState(initial.heure);
  const [message, setMessage] = useState("");
  const [suppression, setSuppression] = useState<JournalEntry | null>(null);

  function reinitialiser() { setEditionId(null); setDescription(""); setType("Repas"); }

  function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const horodatage = new Date(`${date}T${heure}:00`);
    if (!description.trim() || !Number.isFinite(horodatage.getTime())) return;
    const entree: JournalEntry = { id: editionId || crypto.randomUUID(), type, description: description.trim(), date: horodatage.toLocaleDateString("fr-FR"), heure, timestamp: horodatage.toISOString() };
    const actuelles = lireJournalLocal();
    const prochaines = editionId ? actuelles.map((item) => item.id === editionId ? entree : item) : [...actuelles, entree];
    if (!sauvegarderLocal(STORAGE_KEYS.journal, prochaines)) return;
    setMessage(editionId ? "Événement mis à jour." : "Événement ajouté au journal.");
    reinitialiser();
  }

  function modifier(entree: JournalEntry) {
    setEditionId(entree.id || null); setType(entree.type || "Repas"); setDescription(entree.description || ""); setHeure(entree.heure || initial.heure);
    if (entree.timestamp) { const d = new Date(entree.timestamp); const offset = d.getTimezoneOffset() * 60_000; setDate(new Date(d.getTime() - offset).toISOString().slice(0, 10)); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function supprimer() {
    if (!suppression) return;
    if (sauvegarderLocal(STORAGE_KEYS.journal, lireJournalLocal().filter((item) => item.id !== suppression.id))) { setMessage("Événement supprimé."); setSuppression(null); }
  }

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Contexte" title="Journal Diabia" description="Ajoute et gère les événements qui contextualisent tes variations." />
      <GlassPanel>
        <form onSubmit={enregistrer} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3"><FormField label="Type d’événement"><select className={fieldClassName} value={type} onChange={(e) => setType(e.target.value)}><option>Repas</option><option>Insuline</option><option>Activité</option></select></FormField><FormField label="Date"><input required type="date" className={fieldClassName} value={date} onChange={(e) => setDate(e.target.value)} /></FormField><FormField label="Heure"><input required type="time" className={fieldClassName} value={heure} onChange={(e) => setHeure(e.target.value)} /></FormField></div>
          <FormField label="Description"><textarea required className={`${fieldClassName} min-h-32 resize-y`} placeholder="Pizza, marche, injection…" value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
          <div className="flex gap-3"><button type="submit" disabled={!description || !date || !heure} className={primaryButtonClassName}>{editionId ? "Mettre à jour" : "Ajouter au journal"}</button>{editionId && <button type="button" onClick={reinitialiser} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button>}</div>
          {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
        </form>
      </GlassPanel>
      {suppression && <div role="alertdialog" aria-modal="true" className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5"><p className="font-semibold text-red-900">Supprimer « {suppression.description} » ?</p><div className="mt-4 flex gap-3"><button type="button" onClick={supprimer} className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white">Supprimer</button><button type="button" onClick={() => setSuppression(null)} className="rounded-2xl px-5 py-3 text-sm font-semibold">Annuler</button></div></div>}
      <GlassPanel className="mt-5"><h2 className="text-xl font-semibold text-slate-950">Événements enregistrés</h2>{entrees.length ? <div className="mt-5 grid gap-3">{entrees.map((entree, index) => <article key={entree.id || index} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{entree.type} · {entree.description}</p><p className="mt-1 text-xs text-slate-500">{entree.date || "Date inconnue"} {entree.heure || ""}</p></div><div className="flex gap-4 text-sm"><button type="button" onClick={() => modifier(entree)} className="font-semibold text-blue-700">Modifier</button><button type="button" onClick={() => setSuppression(entree)} className="font-semibold text-red-700">Supprimer</button></div></article>)}</div> : <p className="mt-5 text-sm text-slate-500">Aucun événement enregistré.</p>}</GlassPanel>
    </PageShell>
  );
}
