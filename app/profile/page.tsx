"use client";

import { useState, useSyncExternalStore } from "react";
import type { ProfilDiabia } from "../../lib/analyses/types";
import { FormField, GlassPanel, PageHero, PageShell, fieldClassName, primaryButtonClassName } from "../components/PageShell";

const EMPTY_PROFILE = "{}";

function subscribeToProfile(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readProfile() {
  return localStorage.getItem("profil") || EMPTY_PROFILE;
}

function readServerProfile() {
  return EMPTY_PROFILE;
}

function parseProfile(snapshot: string): ProfilDiabia {
  try {
    const value = JSON.parse(snapshot);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function ProfileForm({ initialProfile }: { initialProfile: ProfilDiabia }) {
  const [profil, setProfil] = useState<ProfilDiabia>(initialProfile);

  function sauvegarder() {
    localStorage.setItem("profil", JSON.stringify(profil));
    alert("Profil enregistré !");
  }

  return (
    <GlassPanel className="space-y-5">
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
      <button
        type="button"
        onClick={sauvegarder}
        className={primaryButtonClassName}
      >
        Enregistrer
      </button>
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
    </PageShell>
  );
}
