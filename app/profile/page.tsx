"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ProfilDiabia } from "../../lib/analyses/types";
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

  function sauvegarder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sauvegarderLocal(STORAGE_KEYS.profil, profil, { notifier: false })) { setErreur("Le profil n’a pas pu être enregistré dans ce navigateur."); setSucces(""); return; }
    setErreur(""); setSucces("Profil enregistré dans ce navigateur.");
  }

  return <GlassPanel><form onSubmit={sauvegarder} className="space-y-5">
    <FormField label="Prénom" hint="facultatif"><input maxLength={LIMITES_SAISIE.prenomMax} className={fieldClassName} value={profil.prenom || ""} onChange={(event) => setProfil({ ...profil, prenom: event.target.value })} autoComplete="given-name" /></FormField>
    <FormField label="Type de diabète"><select className={fieldClassName} value={profil.diabete || ""} onChange={(event) => setProfil({ ...profil, diabete: event.target.value })}><option value="">Sélectionner</option><option>Type 1</option><option>Type 2</option><option>Autre</option></select></FormField>
    <FormField label="Appareil utilisé"><select className={fieldClassName} value={profil.appareil || ""} onChange={(event) => setProfil({ ...profil, appareil: event.target.value })}><option value="">Sélectionner</option><option>Capteur glucose</option><option>Pompe à insuline</option><option>Stylo à insuline</option></select></FormField>
    <FormField label="Objectif principal"><select className={fieldClassName} value={profil.objectif || ""} onChange={(event) => setProfil({ ...profil, objectif: event.target.value })}><option value="">Sélectionner</option><option>Améliorer la stabilité</option><option>Réduire les hyperglycémies</option><option>Réduire les hypoglycémies</option><option>Mieux comprendre mes variations</option></select></FormField>
    <FormField label="Unité de saisie préférée"><select className={fieldClassName} value={profil.uniteGlycemie || "mg/dL"} onChange={(event) => setProfil({ ...profil, uniteGlycemie: event.target.value as ProfilDiabia["uniteGlycemie"] })}><option>mg/dL</option><option>g/L</option><option>mmol/L</option></select></FormField>
    <button type="submit" className={primaryButtonClassName}>Enregistrer</button>
    {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
    {succes && <p role="status" className="text-sm font-medium text-emerald-700">{succes}</p>}
  </form></GlassPanel>;
}

function DataControls() {
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function exporter() {
    const blob = new Blob([JSON.stringify(exporterDonneesLocales(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a"); lien.href = url; lien.download = `diabia-export-${new Date().toISOString().slice(0, 10)}.json`; lien.click(); URL.revokeObjectURL(url);
    setErreur(""); setSucces("Export téléchargé. Conserve ce fichier dans un emplacement sûr : il contient tes données Diabia.");
  }

  async function restaurer(event: React.ChangeEvent<HTMLInputElement>) {
    const fichier = event.target.files?.[0];
    event.target.value = "";
    if (!fichier) return;
    try {
      const contenu = JSON.parse(await fichier.text()) as unknown;
      if (!restaurerDonneesLocales(contenu)) throw new Error("format");
      setErreur(""); setSucces("Sauvegarde restaurée. Les mesures, le journal et le profil ont été remplacés.");
    } catch {
      setSucces(""); setErreur("Ce fichier n’est pas un export Diabia valide. Aucune donnée n’a été modifiée.");
    }
  }

  function supprimer() {
    if (!supprimerDonneesLocales()) { setErreur("Les données n’ont pas pu être supprimées de ce navigateur."); return; }
    setConfirmation(false); window.location.reload();
  }

  return <GlassPanel className="mt-5">
    <h2 className="text-xl font-semibold text-slate-950">Gestion des données</h2>
    <p className="mt-2 text-sm leading-6 text-slate-500">Les données restent liées à ce navigateur et peuvent disparaître si son stockage est effacé. Exporte régulièrement une sauvegarde JSON que tu pourras restaurer ici.</p>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button type="button" onClick={exporter} className={primaryButtonClassName}>Exporter mes données</button>
      <button type="button" onClick={() => importRef.current?.click()} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-blue-700">Restaurer une sauvegarde</button>
      <input ref={importRef} type="file" accept="application/json,.json" onChange={restaurer} className="sr-only" aria-label="Choisir un export JSON Diabia à restaurer" />
      <button type="button" onClick={() => setConfirmation(true)} className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100">Supprimer mes données</button>
    </div>
    {confirmation && <ConfirmDialog title="Supprimer définitivement toutes les données ?" description="Les mesures, le journal et le profil de ce navigateur seront supprimés. Exporte une sauvegarde avant de continuer si tu souhaites pouvoir les restaurer." confirmLabel="Confirmer la suppression" onConfirm={supprimer} onCancel={() => setConfirmation(false)} />}
    {erreur && <p role="alert" className="mt-4 text-sm font-medium text-red-700">{erreur}</p>}
    {succes && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{succes}</p>}
  </GlassPanel>;
}

export default function Profile() {
  const snapshot = useSyncExternalStore(subscribeToProfile, () => lireValeurLocale(STORAGE_KEYS.profil, EMPTY_PROFILE), () => EMPTY_PROFILE);
  const profile = useMemo(() => parseProfile(snapshot), [snapshot]);
  return <PageShell width="max-w-4xl"><PageHero eyebrow="Personnalisation" title="Mon profil" description="Ces informations donnent du contexte à l’assistant. Les analyses automatiques restent fondées sur les mesures et doivent être interprétées avec des objectifs individualisés." /><ProfileForm key={snapshot} initialProfile={profile} /><DataControls /></PageShell>;
}
