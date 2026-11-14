"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ProfilDiabia } from "../../lib/analyses/types";
import { sauvegardeValide } from "../../lib/sauvegarde";
import { LIMITES_SAISIE } from "../../lib/saisie";
import { exporterDonneesLocales, lireValeurLocale, restaurerDonneesLocales, sauvegarderLocal, supprimerDonneesLocales } from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserProfil } from "../../lib/validation";
import ConfirmDialog from "../components/ConfirmDialog";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

const EMPTY_PROFILE = "{}";

function subscribeToProfile(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("diabia:storage", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("diabia:storage", callback); };
}

function parseProfile(snapshot: string): ProfilDiabia {
  try { return normaliserProfil(JSON.parse(snapshot)); } catch { return {}; }
}

function ProfileForm({ initialProfile }: { initialProfile: ProfilDiabia }) {
  const [profil, setProfil] = useState<ProfilDiabia>(initialProfile);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const modifie = JSON.stringify(profil) !== JSON.stringify(initialProfile);
  const initiale = profil.prenom?.trim().charAt(0).toLocaleUpperCase("fr-FR") || "D";
  function modifier(champ: keyof ProfilDiabia, valeur: string) {
    setProfil({ ...profil, [champ]: valeur }); setSucces(""); setErreur("");
  }
  function sauvegarder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sauvegarderLocal(STORAGE_KEYS.profil, profil, { notifier: false })) { setErreur("Le profil n’a pas pu être enregistré dans ce navigateur."); setSucces(""); return; }
    setErreur(""); setSucces("Tes préférences ont bien été enregistrées.");
  }
  const choix = "relative flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-1 has-[:checked]:ring-blue-500";
  return <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="space-y-5 lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/10">
        <div aria-hidden="true" className="absolute -right-12 -top-10 size-48 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-blue-100"><span className="size-1.5 rounded-full bg-cyan-300" />Mon espace Diabia</span>
        <div aria-hidden="true" className="mt-7 grid size-20 place-items-center rounded-[1.7rem] border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-semibold shadow-lg shadow-blue-900/40">{initiale}</div>
        <h2 className="mt-5 break-words text-2xl font-semibold tracking-tight">{profil.prenom?.trim() || "Bienvenue chez toi"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Un suivi qui s’adapte à tes habitudes. Tes préférences, au même endroit.</p>
        <div className="mt-6 border-t border-white/10 pt-5"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Unité préférée</p><p className="mt-1 text-lg font-semibold">{profil.uniteGlycemie || "mg/dL"}</p></div></div>
      </div>
      <nav aria-label="Sections du profil" className="grid gap-1 rounded-3xl border border-white bg-white/80 p-3 text-sm font-medium text-slate-600"><a href="#informations" className="rounded-2xl px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700">01 <span className="ml-3">Informations personnelles</span></a><a href="#preferences" className="rounded-2xl px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700">02 <span className="ml-3">Préférences de suivi</span></a><a href="#donnees" className="rounded-2xl px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700">03 <span className="ml-3">Mes données</span></a></nav>
      <div className="flex gap-3 px-3 text-xs leading-5 text-slate-500"><span aria-hidden="true" className="mt-0.5 text-blue-600">◈</span><p>Enregistré dans ce navigateur. Tu gardes la main sur l’export et la suppression de tes données.</p></div>
    </aside>
    <div className="min-w-0 space-y-6">
      <form onSubmit={sauvegarder} className="space-y-6">
        <GlassPanel><div id="informations" className="scroll-mt-24"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-blue-600">01 / Faisons connaissance</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Quelques mots sur toi</h2><p className="mt-2 text-sm leading-6 text-slate-500">Tous les champs sont facultatifs. Renseigne uniquement ce qui te convient.</p></div>
          <div className="mt-7"><FormField label="Comment souhaites-tu être appelé ?" hint="prénom"><input maxLength={LIMITES_SAISIE.prenomMax} className={fieldClassName} value={profil.prenom || ""} onChange={event => modifier("prenom", event.target.value)} autoComplete="given-name" placeholder="Ton prénom" /></FormField></div>
          <fieldset className="mt-6"><legend className="text-sm font-semibold text-slate-800">Type de diabète</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["", "Non précisé"], ["Type 1", "Type 1"], ["Type 2", "Type 2"], ["Autre", "Autre"]].map(([valeur,label]) => <label key={label} className={`${choix} justify-center px-3`}><input type="radio" name="diabete" value={valeur} checked={(profil.diabete || "") === valeur} onChange={() => modifier("diabete", valeur)} className="size-4 accent-blue-600" /><span className="text-sm font-medium text-slate-700">{label}</span></label>)}</div></fieldset>
        </GlassPanel>
        <GlassPanel><div id="preferences" className="scroll-mt-24"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-blue-600">02 / À ta façon</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Tes préférences de suivi</h2><p className="mt-2 text-sm leading-6 text-slate-500">Personnalise ton espace et l’unité proposée lors de la saisie.</p></div>
          <fieldset className="mt-7"><legend className="text-sm font-semibold text-slate-800">Ton appareil principal</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["", "Non précisé", "À renseigner plus tard", "○"], ["Capteur glucose", "Capteur de glucose", "Pour suivre les mesures", "◎"], ["Pompe à insuline", "Pompe à insuline", "Pour administrer l’insuline", "▤"], ["Stylo à insuline", "Stylo à insuline", "Pour les injections", "↗"]].map(([valeur,label,detail,icone]) => <label key={label} className={choix}><input type="radio" name="appareil" checked={(profil.appareil || "") === valeur} onChange={() => modifier("appareil", valeur)} className="size-4 shrink-0 accent-blue-600" /><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl text-blue-600">{icone}</span><span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{detail}</span></span></label>)}</div></fieldset>
          <fieldset className="mt-7"><legend className="text-sm font-semibold text-slate-800">Unité de glycémie préférée</legend><div className="mt-3 grid grid-cols-3 gap-2 rounded-[1.3rem] bg-slate-100 p-1.5">{["mg/dL", "g/L", "mmol/L"].map(unite => <label key={unite} className="flex cursor-pointer flex-wrap items-center justify-center gap-2 rounded-2xl px-2 py-3 text-sm font-semibold text-slate-500 transition has-[:checked]:bg-white has-[:checked]:text-blue-700 has-[:checked]:shadow-sm"><input type="radio" name="unite" checked={(profil.uniteGlycemie || "mg/dL") === unite} onChange={() => modifier("uniteGlycemie", unite)} className="size-3.5 accent-blue-600" />{unite}</label>)}</div><p className="mt-2 text-xs leading-5 text-slate-400">Change l’unité proposée à la saisie. Les valeurs de l’historique restent affichées en mg/dL.</p></fieldset>
          <div className="mt-7"><FormField label="Ce que tu souhaites mieux suivre"><select className={fieldClassName} value={profil.objectif || ""} onChange={event => modifier("objectif", event.target.value)}><option value="">Choisir un objectif · facultatif</option><option>Améliorer la stabilité</option><option>Réduire les hyperglycémies</option><option>Réduire les hypoglycémies</option><option>Mieux comprendre mes variations</option></select></FormField><p className="mt-2 text-xs leading-5 text-slate-400">Une préférence personnelle, sans modification de tes objectifs médicaux ou de ton traitement.</p></div>
        </GlassPanel>
        <div className="flex flex-col gap-4 rounded-3xl border border-white bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div aria-live="polite"><p className={`text-sm font-medium ${erreur ? "text-rose-700" : succes ? "text-emerald-700" : "text-slate-700"}`}>{erreur || succes || (modifie ? "Des préférences ont été modifiées." : "Ton espace, tes préférences.")}</p><p className="mt-1 text-xs text-slate-400">Sauvegarde locale dans ce navigateur.</p></div><button type="submit" className={primaryButtonClassName}>Enregistrer mes préférences <span aria-hidden="true" className="ml-2">→</span></button></div>
      </form>
      <DataControls />
    </div>
  </div>;
}

function DataControls() {
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [aRestaurer, setARestaurer] = useState<unknown>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function exporter() {
    try {
    const blob = new Blob([JSON.stringify(exporterDonneesLocales(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a"); lien.href = url; lien.download = `diabia-export-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(lien); lien.click(); lien.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setErreur(""); setSucces("Export proposé au téléchargement. Conserve ce fichier dans un emplacement sûr : il contient tes données Diabia.");
    } catch { setSucces(""); setErreur("Impossible de générer une sauvegarde valide. Le stockage est inaccessible ou certaines données locales doivent être vérifiées. Aucune donnée n’a été effacée."); }
  }

  async function restaurer(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    event.target.value = "";
    if (!fichier) return;
    try {
      if (fichier.size > 10 * 1024 * 1024) { setErreur("Le fichier dépasse la limite de 10 Mo. Aucune donnée n’a été modifiée."); return; }
      const contenu = JSON.parse(await fichier.text()) as unknown;
      if (!sauvegardeValide(contenu)) throw new Error("format");
      setErreur(""); setSucces(""); setARestaurer(contenu);
    } catch {
      setSucces(""); setErreur("Ce fichier n’est pas un export Diabia valide. Aucune donnée n’a été modifiée.");
    }
  }

  function confirmerRestauration() {
    if (!restaurerDonneesLocales(aRestaurer)) { setARestaurer(null); setErreur("La sauvegarde n’a pas pu être restaurée. Vérifie l’espace disponible et les autorisations de stockage."); return; }
    setARestaurer(null); setErreur(""); setSucces("Sauvegarde restaurée dans ce navigateur.");
  }

  function supprimer() {
    if (!supprimerDonneesLocales()) { setErreur("Les données n’ont pas pu être supprimées de ce navigateur."); return; }
    setConfirmation(false); window.location.reload();
  }

  return <GlassPanel>
    <div id="donnees" className="scroll-mt-24"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-blue-600">03 / Tu gardes le contrôle</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Tes données t’appartiennent</h2><p className="mt-2 text-sm leading-6 text-slate-500">Le stockage est lié à ce navigateur. Garde une sauvegarde pour retrouver tes données si tu changes d’appareil ou effaces le navigateur.</p></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={exporter} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/50"><span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-blue-50 text-xl text-blue-600">↓</span><span className="mt-4 block text-sm font-semibold text-slate-900">Exporter une sauvegarde <span aria-hidden="true" className="float-right text-blue-600">↗</span></span><span className="mt-1 block text-xs leading-5 text-slate-500">Télécharger ton profil, tes mesures et ton journal au format JSON.</span></button>
      <button type="button" onClick={() => importRef.current?.click()} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/50"><span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-violet-50 text-xl text-violet-600">↑</span><span className="mt-4 block text-sm font-semibold text-slate-900">Restaurer une sauvegarde <span aria-hidden="true" className="float-right text-violet-600">↗</span></span><span className="mt-1 block text-xs leading-5 text-slate-500">Remplacer les données actuelles par celles d’un export Diabia.</span></button>
      <input ref={importRef} type="file" accept="application/json,.json" onChange={restaurer} className="sr-only" aria-label="Choisir un export JSON Diabia à restaurer" />
    </div>
    <details className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/40 p-4"><summary className="cursor-pointer text-sm font-medium text-rose-800">Effacer les données de ce navigateur</summary><p className="mt-3 text-xs leading-5 text-slate-500">Cette action supprime les mesures, les doses d’insuline, le journal et le profil. Pense à télécharger une sauvegarde.</p><button type="button" onClick={() => setConfirmation(true)} className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Supprimer mes données</button></details>
    {aRestaurer !== null && <ConfirmDialog title="Restaurer cette sauvegarde ?" description="Les mesures, les doses, le journal et le profil actuels seront remplacés par ceux du fichier. Exporte tes données actuelles avant de continuer si tu veux les conserver." confirmLabel="Restaurer la sauvegarde" onConfirm={confirmerRestauration} onCancel={() => setARestaurer(null)} />}
    {confirmation && <ConfirmDialog title="Supprimer définitivement toutes les données ?" description="Les mesures, le journal et le profil de ce navigateur seront supprimés. Exporte une sauvegarde avant de continuer si tu souhaites pouvoir les restaurer." confirmLabel="Confirmer la suppression" onConfirm={supprimer} onCancel={() => setConfirmation(false)} />}
    {erreur && <p role="alert" className="mt-4 text-sm font-medium text-red-700">{erreur}</p>}
    {succes && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{succes}</p>}
  </GlassPanel>;
}

export default function Profile() {
  const snapshot = useSyncExternalStore(subscribeToProfile, () => lireValeurLocale(STORAGE_KEYS.profil, EMPTY_PROFILE), () => EMPTY_PROFILE);
  const profile = useMemo(() => parseProfile(snapshot), [snapshot]);
  return <PageShell width="max-w-6xl"><PageHero eyebrow="Mon espace personnel" title="Un suivi qui te ressemble." description="Prends un moment pour personnaliser ton profil, choisir tes préférences et gérer tes données." /><ProfileForm key={snapshot} initialProfile={profile} /></PageShell>;
}
