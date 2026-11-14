"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { migrerStockageLocal, verifierStockage } from "../../lib/storage";
export default function StorageMigration() {
  const [etat,setEtat] = useState<"ok" | "bloque" | "corrompu">("ok");
  useEffect(() => {
    function verifier() { const status = verifierStockage(); setEtat(status === "ok" && !migrerStockageLocal() ? "bloque" : status); }
    const synchroniser = (event: StorageEvent) => { if (event.key !== "diabia_storage_probe") verifier(); };
    verifier(); window.addEventListener("diabia:storage",verifier); window.addEventListener("storage",synchroniser);
    return () => { window.removeEventListener("diabia:storage",verifier); window.removeEventListener("storage",synchroniser); };
  }, []);
  if (etat === "ok") return null;
  return <div role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950"><div className="mx-auto max-w-6xl"><strong>{etat === "bloque" ? "L’enregistrement local est indisponible." : "Les données locales semblent endommagées."}</strong> {etat === "bloque" ? "Le navigateur peut bloquer le stockage, ou l’espace disponible être insuffisant. Les nouvelles saisies ne sont pas garanties d’être sauvegardées." : "Aucune réparation automatique n’a été appliquée. Évite de remplacer les données avant d’avoir vérifié ta sauvegarde."} <Link href="/profile/#donnees" className="font-semibold underline">Gérer mes données</Link></div></div>;
}
