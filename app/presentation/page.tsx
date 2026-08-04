import Link from "next/link";
import { GlassPanel, PageHero, PageShell } from "../components/PageShell";

export default function Presentation() {
  return (
    <PageShell>
      <PageHero eyebrow="À propos" title="Bienvenue sur Diabia" description="Un espace personnel conçu pour rendre les données glycémiques plus simples à explorer et à comprendre." backHref="/" />
      <div className="grid gap-5 md:grid-cols-3">
        {[["01", "Importer", "Charge un export CSV ou ajoute une mesure manuellement."], ["02", "Comprendre", "Explore ton score, tes périodes hors cible et tes variations."], ["03", "Questionner", "Demande à l’assistant local d’expliquer les résultats disponibles."]].map(([number, title, text]) => <GlassPanel key={number}><span className="text-xs font-semibold tracking-[0.2em] text-blue-600">{number}</span><h2 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></GlassPanel>)}
      </div>
      <div className="mt-6 rounded-[2rem] bg-slate-950 p-7 text-white sm:flex sm:items-center sm:justify-between"><div><h2 className="text-2xl font-semibold">Prêt à découvrir tes tendances ?</h2><p className="mt-2 text-sm text-slate-400">Commence avec un fichier CSV ou quelques mesures manuelles.</p></div><Link href="/import" className="mt-5 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 sm:mt-0">Commencer</Link></div>
    </PageShell>
  );
}
