"use client";

import { useState, useSyncExternalStore } from "react";
import type { ProfilDiabia } from "../../lib/analyses/types";

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
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
      <h1 className="text-3xl font-bold text-blue-600">Profil Diabia</h1>
      <p className="mt-4">Ces informations permettent à Diabia de personnaliser ses analyses.</p>

      <label className="mt-6 block font-bold" htmlFor="diabete">Type de diabète</label>
      <select
        id="diabete"
        className="mt-2 w-full rounded-xl border p-3"
        value={profil.diabete || ""}
        onChange={(event) => setProfil({ ...profil, diabete: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Type 1</option>
        <option>Type 2</option>
        <option>Autre</option>
      </select>

      <label className="mt-6 block font-bold" htmlFor="appareil">Appareil utilisé</label>
      <select
        id="appareil"
        className="mt-2 w-full rounded-xl border p-3"
        value={profil.appareil || ""}
        onChange={(event) => setProfil({ ...profil, appareil: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Capteur glucose</option>
        <option>Pompe à insuline</option>
        <option>Stylo à insuline</option>
      </select>

      <label className="mt-6 block font-bold" htmlFor="objectif">Objectif principal</label>
      <select
        id="objectif"
        className="mt-2 w-full rounded-xl border p-3"
        value={profil.objectif || ""}
        onChange={(event) => setProfil({ ...profil, objectif: event.target.value })}
      >
        <option value="">Sélectionner</option>
        <option>Améliorer la stabilité</option>
        <option>Réduire les hyperglycémies</option>
        <option>Réduire les hypoglycémies</option>
        <option>Mieux comprendre mes variations</option>
      </select>

      <button
        type="button"
        onClick={sauvegarder}
        className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-white"
      >
        Enregistrer
      </button>
    </div>
  );
}

export default function Profile() {
  const snapshot = useSyncExternalStore(
    subscribeToProfile,
    readProfile,
    readServerProfile
  );

  return (
    <main className="min-h-screen bg-blue-50 p-8">
      <ProfileForm key={snapshot} initialProfile={parseProfile(snapshot)} />
    </main>
  );
}
