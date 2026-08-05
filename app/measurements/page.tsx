"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Mesure } from "../../lib/analyses/types";
import { trierMesuresChronologiquement } from "../../lib/dates";
import { lireMesuresLocales, lireValeurLocale, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserMesures } from "../../lib/validation";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

export default function MeasurementsPage() {
  const snapshot = useSyncExternalStore(
    (callback) => { window.addEventListener("storage", callback); window.addEventListener("diabia:storage", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("diabia:storage", callback); }; },
    () => lireValeurLocale(STORAGE_KEYS.mesures, "[]"),
    () => "[]"
  );
  const mesures = useMemo(() => {
    try { return trierMesuresChronologiquement(normaliserMesures(JSON.parse(snapshot))).reverse(); }
    catch { return []; }
  }, [snapshot]);
  const [edition, setEdition] = useState<Mesure | null>(null);
  const [suppression, setSuppression] = useState<Mesure | null>(null);
  const [message, setMessage] = useState("");

  function persister(prochaines: Mesure[], confirmation: string) {
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, prochaines)) return;
    setMessage(confirmation);
  }

  function enregistrerEdition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edition) return;
    const glycemie = Number(edition.glycemie);
    if (!Number.isFinite(glycemie) || glycemie <= 0) return;
    const timestamp = edition.date && edition.heure ? new Date(`${edition.date.split("/").reverse().join("-")}T${edition.heure}:00`) : null;
    const prochaine = { ...edition, glycemie, ...(timestamp && Number.isFinite(timestamp.getTime()) ? { timestamp: timestamp.toISOString() } : {}) };
    persister(lireMesuresLocales().map((mesure) => mesure.id === edition.id ? prochaine : mesure), "Mesure mise à jour.");
    setEdition(null);
  }

  function confirmerSuppression() {
    if (!suppression) return;
    persister(lireMesuresLocales().filter((mesure) => mesure.id !== suppression.id), "Mesure supprimée.");
    setSuppression(null);
  }

  return (
    <PageShell width="max-w-6xl">
      <PageHero eyebrow="Historique" title="Mes mesures" description="Consulte, corrige ou supprime individuellement les données enregistrées dans ce navigateur." />
      {message && <p role="status" className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
      {edition && <GlassPanel className="mb-5"><form onSubmit={enregistrerEdition} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><FormField label="Glycémie" hint="mg/dL"><input className={fieldClassName} type="number" min="0.1" step="any" value={edition.glycemie} onChange={(e) => setEdition({ ...edition, glycemie: e.target.value })} /></FormField><FormField label="Insuline" hint="unités"><input className={fieldClassName} type="number" min="0" step="any" value={edition.insuline || ""} onChange={(e) => setEdition({ ...edition, insuline: e.target.value })} /></FormField><FormField label="Date"><input className={fieldClassName} value={edition.date || ""} onChange={(e) => setEdition({ ...edition, date: e.target.value })} /></FormField><FormField label="Heure"><input className={fieldClassName} type="time" value={edition.heure || ""} onChange={(e) => setEdition({ ...edition, heure: e.target.value })} /></FormField><FormField label="Note"><input className={fieldClassName} value={edition.note || ""} onChange={(e) => setEdition({ ...edition, note: e.target.value })} /></FormField><div className="flex gap-3 sm:col-span-2 lg:col-span-5"><button className={primaryButtonClassName} type="submit">Enregistrer</button><button type="button" onClick={() => setEdition(null)} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button></div></form></GlassPanel>}
      {suppression && <div role="alertdialog" aria-modal="true" className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5"><p className="font-semibold text-red-900">Supprimer la mesure de {suppression.glycemie} mg/dL ?</p><div className="mt-4 flex gap-3"><button type="button" onClick={confirmerSuppression} className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white">Supprimer</button><button type="button" onClick={() => setSuppression(null)} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button></div></div>}
      <GlassPanel>
        {mesures.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-slate-500"><tr><th className="p-3">Date et heure</th><th className="p-3">Glycémie</th><th className="p-3">Insuline</th><th className="p-3">Note</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{mesures.map((mesure, index) => <tr key={mesure.id || `${mesure.timestamp}-${index}`} className="border-t border-slate-100"><td className="p-3">{mesure.date || "—"} {mesure.heure || ""}</td><td className="p-3 font-semibold text-slate-950">{mesure.glycemie} mg/dL</td><td className="p-3">{mesure.insuline || "—"}</td><td className="max-w-xs truncate p-3">{mesure.note || "—"}</td><td className="p-3 text-right"><button type="button" onClick={() => setEdition(mesure)} className="mr-3 font-semibold text-blue-700">Modifier</button><button type="button" onClick={() => setSuppression(mesure)} className="font-semibold text-red-700">Supprimer</button></td></tr>)}</tbody></table></div> : <p className="py-12 text-center text-slate-500">Aucune mesure enregistrée.</p>}
      </GlassPanel>
    </PageShell>
  );
}
