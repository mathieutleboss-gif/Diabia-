"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { formaterDose, lireDoseInsuline } from "../../lib/insuline";
import type { Mesure } from "../../lib/analyses/types";
import { trierMesuresChronologiquement } from "../../lib/dates";
import { ROUTES } from "../../lib/routes";
import { dateVersChamp, LIMITES_SAISIE, validerGlycemieMgDl, validerHorodatage, validerInsuline } from "../../lib/saisie";
import { lireMesuresLocales, lireValeurLocale, sauvegarderLocal } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserMesures } from "../../lib/validation";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

const TAILLE_PAGE = 100;

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
  const [erreur, setErreur] = useState("");
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(mesures.length / TAILLE_PAGE));
  const pageActive = Math.min(page, pages);
  const mesuresAffichees = mesures.slice((pageActive - 1) * TAILLE_PAGE, pageActive * TAILLE_PAGE);

  function persister(prochaines: Mesure[], confirmation: string): boolean {
    if (!sauvegarderLocal(STORAGE_KEYS.mesures, prochaines)) {
      setErreur("La modification n’a pas pu être enregistrée dans ce navigateur.");
      return false;
    }
    setErreur(""); setMessage(confirmation); return true;
  }

  function commencerEdition(mesure: Mesure) {
    setErreur("");
    setEdition({ ...mesure, date: dateVersChamp(mesure.date, mesure.timestamp) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enregistrerEdition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edition) return;
    const glycemie = Number(edition.glycemie);
    const insuline = edition.insuline === "" || edition.insuline === undefined ? undefined : Number(String(edition.insuline).replace(",", "."));
    const erreurGlycemie = validerGlycemieMgDl(glycemie);
    const erreurInsuline = insuline === undefined ? null : validerInsuline(insuline);
    const validationDate = validerHorodatage(edition.date || "", edition.heure || "");
    if (erreurGlycemie || erreurInsuline || !validationDate.date) {
      setErreur(erreurGlycemie || erreurInsuline || validationDate.erreur || "Date invalide.");
      return;
    }
    const prochaine = {
      ...edition,
      glycemie,
      insuline,
      date: validationDate.date.toLocaleDateString("fr-FR"),
      timestamp: validationDate.date.toISOString(),
      note: edition.note?.slice(0, LIMITES_SAISIE.noteMax),
    };
    if (persister(lireMesuresLocales().map((mesure) => mesure.id === edition.id ? prochaine : mesure), "Mesure mise à jour.")) setEdition(null);
  }

  function confirmerSuppression() {
    if (!suppression) return;
    if (persister(lireMesuresLocales().filter((mesure) => mesure.id !== suppression.id), "Mesure supprimée.")) setSuppression(null);
  }

  return (
    <PageShell width="max-w-6xl">
      <PageHero eyebrow="Historique" title="Mes mesures" description="Consulte, corrige ou supprime individuellement les données enregistrées dans ce navigateur." />
      {message && <p role="status" className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
      {erreur && <p role="alert" className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{erreur}</p>}
      {edition && <GlassPanel className="mb-5"><form onSubmit={enregistrerEdition} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><FormField label="Glycémie" hint="mg/dL · obligatoire"><input required className={fieldClassName} type="number" min={LIMITES_SAISIE.glycemieMinMgDl} max={LIMITES_SAISIE.glycemieMaxMgDl} step="any" value={edition.glycemie} onChange={(e) => setEdition({ ...edition, glycemie: e.target.value })} /></FormField><FormField label="Insuline" hint="unités"><input className={fieldClassName} type="number" min="0" max={LIMITES_SAISIE.insulineMax} step="any" value={edition.insuline ?? ""} onChange={(e) => setEdition({ ...edition, insuline: e.target.value })} /></FormField><FormField label="Date" hint="obligatoire"><input required className={fieldClassName} type="date" value={edition.date || ""} onChange={(e) => setEdition({ ...edition, date: e.target.value })} /></FormField><FormField label="Heure" hint="obligatoire"><input required className={fieldClassName} type="time" value={edition.heure || ""} onChange={(e) => setEdition({ ...edition, heure: e.target.value })} /></FormField><FormField label="Note"><input maxLength={LIMITES_SAISIE.noteMax} className={fieldClassName} value={edition.note || ""} onChange={(e) => setEdition({ ...edition, note: e.target.value })} /></FormField><div className="flex gap-3 sm:col-span-2 lg:col-span-5"><button className={primaryButtonClassName} type="submit">Enregistrer</button><button type="button" onClick={() => setEdition(null)} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button></div></form></GlassPanel>}
      {suppression && <ConfirmDialog title={`Supprimer la mesure de ${suppression.glycemie} mg/dL ?`} description="Cette mesure sera retirée des statistiques, du graphique et des analyses enregistrées dans ce navigateur." confirmLabel="Supprimer" onConfirm={confirmerSuppression} onCancel={() => setSuppression(null)} />}
      <GlassPanel>
        {mesures.length ? <><p className="mb-4 text-sm text-slate-500">{mesures.length} mesure{mesures.length > 1 ? "s" : ""}. Affichage de {(pageActive - 1) * TAILLE_PAGE + 1} à {Math.min(pageActive * TAILLE_PAGE, mesures.length)}.</p><div className="overflow-x-auto" role="region" aria-label="Tableau des mesures" tabIndex={0}><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-slate-500"><tr><th className="p-3">Date et heure</th><th className="p-3">Glycémie</th><th className="p-3">Insuline (U)</th><th className="p-3">Note</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{mesuresAffichees.map((mesure, index) => <tr key={mesure.id || `${mesure.timestamp}-${index}`} className="border-t border-slate-100"><td className="p-3">{mesure.date || "—"} {mesure.heure || ""}</td><td className="p-3 font-semibold text-slate-950">{mesure.glycemie} mg/dL</td><td className="p-3">{lireDoseInsuline(mesure.insuline) !== null ? <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 font-semibold text-violet-800">{formaterDose(lireDoseInsuline(mesure.insuline)!)} U</span> : <span className="text-xs text-slate-400">Non renseignée</span>}</td><td className="max-w-xs truncate p-3">{mesure.note || "—"}</td><td className="p-3 text-right"><button type="button" onClick={() => commencerEdition(mesure)} className="mr-1 rounded-xl px-2 py-2.5 font-semibold text-blue-700">Modifier</button><button type="button" onClick={() => setSuppression(mesure)} className="rounded-xl px-2 py-2.5 font-semibold text-red-700">Supprimer</button></td></tr>)}</tbody></table></div>{pages > 1 && <nav aria-label="Pagination des mesures" className="mt-5 flex items-center justify-between gap-3"><button type="button" disabled={pageActive === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-40">Précédent</button><span className="text-sm text-slate-500">Page {pageActive} sur {pages}</span><button type="button" disabled={pageActive === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-40">Suivant</button></nav>}</> : <div className="py-10 text-center"><p className="text-slate-500">Aucune mesure enregistrée.</p><div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row"><Link href={ROUTES.ajoutMesure} className={primaryButtonClassName}>Ajouter une mesure</Link><Link href={ROUTES.import} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700">Importer un CSV</Link></div></div>}
      </GlassPanel>
    </PageShell>
  );
}
