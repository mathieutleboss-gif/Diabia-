"use client";

import { useState, useSyncExternalStore } from "react";
import type { ProfilDiabia } from "../../lib/analyses/types";
import {
  exporterDonneesLocales,
  lireValeurLocale,
  sauvegarderLocal,
  supprimerDonneesLocales,
} from "../../lib/storage";
import { STORAGE_KEYS } from "../../lib/storageKeys";
import { normaliserProfil } from "../../lib/validation";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

const EMPTY_PROFILE = "{}";

function subscribeToProfile(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("diabia:storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("diabia:storage", callback);
  };
}

function readProfile() {
  return lireValeurLocale(STORAGE_KEYS.profil, EMPTY_PROFILE);
}

function readServerProfile() {
  return EMPTY_PROFILE;
}

function parseProfile(snapshot: string): ProfilDiabia {
  try {
    return normaliserProfil(JSON.parse(snapshot));
  } catch {
    return {};
  }
}

function ProfileForm({ initialProfile }: { initialProfile: ProfilDiabia }) {
  const [profil, setProfil] = useState<ProfilDiabia>(initialProfile);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  function sauvegarder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sauvegarderLocal(STORAGE_KEYS.profil, profil)) {
      setErreur("Le profil n’a pas pu être enregistré dans ce navigateur.");
      setSucces("");
      return;
    }
    setErreur("");
    setSucces("Profil enregistré dans ce navigateur.");
  }

  return (
    <GlassPanel><form onSubmit={sauvegarder} className="space-y-5">
      <FormField label="Prénom" hint="facultatif">
        <input className={fieldClassName} value={profil.prenom || ""} onChange={(event) => setProfil({ ...profil, prenom: event.target.value })} autoComplete="given-name" />
      </FormField>
      <FormField label="Type de diabète">
      <select
        id="diabete"
        className={fieldClassName}
        value={profil.diabete || ""}
        onChange={(event) => setProfil({ ...profil, diabete: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Type 1</option>
        <option>Type 2</option>
        <option>Autre</option>
      </select>
      </FormField>
      <FormField label="Appareil utilisé">
      <select
        id="appareil"
        className={fieldClassName}
        value={profil.appareil || ""}
        onChange={(event) => setProfil({ ...profil, appareil: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Capteur glucose</option>
        <option>Pompe à insuline</option>
        <option>Stylo à insuline</option>
      </select>
      </FormField>
      <FormField label="Objectif principal">
      <select
        id="objectif"
        className={fieldClassName}
        value={profil.objectif || ""}
        onChange={(event) => setProfil({ ...profil, objectif: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Améliorer la stabilité</option>
        <option>Réduire les hyperglycémies</option>
        <option>Réduire les hypoglycémies</option>
        <option>Mieux comprendre mes variations</option>
      </select>
      </FormField>
      <FormField label="Unité de saisie préférée">
        <select className={fieldClassName} value={profil.uniteGlycemie || "mg/dL"} onChange={(event) => setProfil({ ...profil, uniteGlycemie: event.target.value as ProfilDiabia["uniteGlycemie"] })}><option>mg/dL</option><option>g/L</option><option>mmol/L</option></select>
      </FormField>
      <button
        type="submit"
        className={primaryButtonClassName}
      >
        Enregistrer
      </button>
      {erreur && <p role="alert" className="text-sm font-medium text-red-700">{erreur}</p>}
      {succes && <p role="status" className="text-sm font-medium text-emerald-700">{succes}</p>}
    </form></GlassPanel>
  );
}

function DataControls() {
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  function exporter() {
    const donnees = exporterDonneesLocales();
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `diabia-export-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
    URL.revokeObjectURL(url);
    setSucces("Export téléchargé.");
  }

  function supprimer() {
    if (!supprimerDonneesLocales()) {
      setErreur("Les données n’ont pas pu être supprimées de ce navigateur.");
      return;
    }
    setConfirmation(false);
    window.location.reload();
  }

  return (
    <GlassPanel className="mt-5">
      <h2 className="text-xl font-semibold text-slate-950">Gestion des données</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Télécharge une copie locale ou efface définitivement les informations enregistrées par Diabia dans ce navigateur.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={exporter} className={primaryButtonClassName}>
          Exporter mes données
        </button>
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Supprimer mes données
        </button>
      </div>
      {confirmation && <div role="alertdialog" aria-modal="true" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"><p className="font-semibold text-red-900">Supprimer définitivement les mesures, le journal et le profil de ce navigateur ?</p><div className="mt-4 flex gap-3"><button type="button" onClick={supprimer} className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white">Confirmer la suppression</button><button type="button" onClick={() => setConfirmation(false)} className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600">Annuler</button></div></div>}
      {erreur && <p role="alert" className="mt-4 text-sm font-medium text-red-700">{erreur}</p>}
      {succes && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{succes}</p>}
    </GlassPanel>
  );
}

export default function Profile() {
  const snapshot = useSyncExternalStore(
    subscribeToProfile,
    readProfile,
    readServerProfile
  );

  return (
    <PageShell width="max-w-4xl">
      <PageHero eyebrow="Personnalisation" title="Mon profil" description="Ces informations permettent à Diabia de contextualiser ses explications sans quitter ton navigateur." />
      <ProfileForm key={snapshot} initialProfile={parseProfile(snapshot)} />
      <DataControls />
    </PageShell>
  );
}
