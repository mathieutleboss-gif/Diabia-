"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { lireDoseInsuline } from "../../lib/insuline";
import { exporterDonneesLocales, restaurerDonneesLocales } from "../../lib/storage";

export default function DemoBanner() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  function charger() {
    let existing: ReturnType<typeof exporterDonneesLocales>;
    try { existing = exporterDonneesLocales(); } catch { setMessage("Le stockage est inaccessible ou les données doivent être vérifiées. L’exemple n’a pas été chargé et aucune donnée n’a été remplacée."); return; }
    if (existing.mesures.length && existing.mesures.every(mesure => mesure.id?.startsWith("demo-") && mesure.note === "Exemple fictif de démonstration")) {
      const mesures = existing.mesures.map(mesure => {
        const index = Number(mesure.id?.slice(-1));
        const doseFictive = [3, 5, undefined, 4, undefined][index];
        return { ...mesure, ...(lireDoseInsuline(mesure.insuline) === null && doseFictive !== undefined ? { insuline: doseFictive } : {}) };
      });
      if (!restaurerDonneesLocales({ ...existing, mesures })) { setMessage("L’exemple n’a pas pu être actualisé."); return; }
      setMessage("Exemple fictif actualisé avec les doses d’insuline. Les doses déjà renseignées sont conservées.");
      router.push("/dashboard/"); router.refresh(); return;
    }
    if (existing.mesures.length || existing.injections.length || existing.journal.length || Object.values(existing.profil).some(Boolean)) {
      setMessage("Des données sont déjà présentes. Tu peux les supprimer depuis Profil avant de charger l’exemple.");
      return;
    }
    const mesures = [];
    const journal = [];
    for (let day = 27; day >= 0; day--) {
      const dateObj = new Date(); dateObj.setHours(12,0,0,0); dateObj.setDate(dateObj.getDate() - day);
      const date = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,"0")}-${String(dateObj.getDate()).padStart(2,"0")}`;
      for (const [index,heure] of ["07:30","12:00","15:00","19:30","22:00"].entries()) {
        const glycemie = Math.round(115 + Math.sin(day * 1.7 + index) * 27 + (index === 2 ? 42 : 0) + (day > 14 ? 16 : 0));
        mesures.push({ insuline: [3, 5, undefined, 4, undefined][index], timestamp: new Date(`${date}T${heure}:00`).toISOString(), id: `demo-${date}-${index}`, date, heure, glycemie, note: "Exemple fictif de démonstration" });
      }
      if (day % 3 === 0) journal.push({ id: `demo-journal-${date}`, date, heure: "14:00", type: "activité", description: "Marche — événement entièrement fictif" });
    }
    const ok = restaurerDonneesLocales({ version: 2, mesures, journal, profil: { prenom: "Camille (exemple fictif)", uniteGlycemie: "mg/dL" } });
    if (!ok) {setMessage("Le navigateur n’a pas autorisé le chargement des données fictives.");return;}
    setMessage("Exemple fictif chargé : 140 mesures et 84 doses d’insuline sur 28 jours.");
    router.push("/dashboard/");
    router.refresh();
  }
  return <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
    <div className="mx-auto flex max-w-[1420px] flex-wrap items-center justify-between gap-3">
      <p><strong>Version de démonstration.</strong> Utilise des données fictives pour explorer les écrans. L’assistant IA reste en attente de configuration.</p>
      <button onClick={charger} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Charger / actualiser l’exemple fictif</button>
      {message && <p role="status" className="w-full">{message}</p>}
    </div>
  </div>;
}
