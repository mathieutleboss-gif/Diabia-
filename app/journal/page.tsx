"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { JournalEntry } from "../../lib/analyses/types";
import { LIMITES_SAISIE, validerHorodatage } from "../../lib/saisie";
import { lireJournalLocal, lireValeurLocale, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserJournal } from "../../lib/validation";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

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
  const [erreur, setErreur] = useState("");
  const [suppression, setSuppression] = useState<JournalEntry | null>(null);

  function reinitialiser() { setEditionId(null); setDescription(""); setType("Repas"); }

  function enregistrer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validerHorodatage(date, heure);
    if (!description.trim()) { setErreur("Décris l’événement avant de l’enregistrer."); return; }
    if (!validation.date) { setErreur(validation.erreur || "Date et heure invalides."); return; }
    const entree: JournalEntry = { id: editionId || crypto.randomUUID(), type, description: description.trim(), date: validation.date.toLocaleDateString("fr-FR"), heure, timestamp: validation.date.toISOString() };
    const actuelles = lireJournalLocal();
    const prochaines = editionId ? actuelles.map((item) => item.id === editionId ? entree : item) : [...actuelles, entree];
    if (!sauvegarderLocal(STORAGE_KEYS.journal, prochaines)) { setErreur("L’événement n’a pas pu être enregistré dans ce navigateur."); return; }
    setErreur("");
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
    if (sauvegarderLocal(STORAGE_KEYS.journal, lireJournalLocal().filter((item) => item.id !== suppression.id))) {
      setErreur(""); setMessage("Événement supprimé."); setSuppression(null);
    } else setErreur("L’événement n’a pas pu être supprimé de ce navigateur.");
  }

  return (
    <PageShell width="max-w-5xl">
      <PageHero eyebrow="Contexte" title="Journal Diabia" description="Ajoute et gère les événements qui contextualisent tes variations." />
      <GlassPanel>
        <form onSubmit={enregistrer} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Type d’événement"><select className={fieldClassName} value={type} onChange={(e) => setType(e.target.value)}><option>Repas</option><option>Insuline</option><option>Activité</option><option>Sommeil</option><option>Stress</option><option>Maladie</option><option>Autre</option></select></FormField>
            <FormField label="Date" hint="obligatoire"><input required type="date" className={fieldClassName} value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
            <FormField label="Heure" hint="obligatoire"><input required type="time" className={fieldClassName} value={heure} onChange={(e) => setHeure(e.target.value)} /></FormField>
          </div>
          <FormField label="Description" hint="obligatoire"><textarea required maxLength={LIMITES_SAISIE.descriptionMax} className={`${fieldClassName} min-h-32 resize-y`} placeholder="Pizza, marche, injection, nuit courte, stress…" value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
          <div className="flex gap-3"><button type="submit" disabled={!description || !date || !heure} className={primaryButtonClassName}>{editionId ? "Mettre à jour" : "Ajouter au journal"}</button>{editionId && <button type="button" onClick={reinitialiser} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button>}</div>
          {message && <p role="status" className="text-sm font-medium text-emerald-700">{message}</p>}
          {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
        </form>
      </GlassPanel>
      {suppression && <ConfirmDialog title={`Supprimer « ${suppression.description} » ?`} description="Cette action retirera définitivement cet événement du journal enregistré dans ce navigateur." confirmLabel="Supprimer" onConfirm={supprimer} onCancel={() => setSuppression(null)} />}
      <GlassPanel className="mt-5">
        <h2 className="text-xl font-semibold text-slate-950">Événements enregistrés</h2>
        {entrees.length ? <div className="mt-5 grid gap-3">{entrees.map((entree, index) => <article key={entree.id || index} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{entree.type} · {entree.description}</p><p className="mt-1 text-xs text-slate-500">{entree.date || "Date inconnue"} {entree.heure || ""}</p></div><div className="flex gap-2 text-sm"><button type="button" onClick={() => modifier(entree)} className="rounded-xl px-2 py-2.5 font-semibold text-blue-700">Modifier</button><button type="button" onClick={() => setSuppression(entree)} className="rounded-xl px-2 py-2.5 font-semibold text-red-700">Supprimer</button></div></article>)}</div> : <p className="mt-5 text-sm text-slate-500">Aucun événement enregistré.</p>}
      </GlassPanel>
    </PageShell>
  );
}
