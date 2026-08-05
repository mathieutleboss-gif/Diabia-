import Link from "next/link";
import { ROUTES } from "../lib/routes";

const features = [
  ["◎", "Analyse claire", "Mesures dans la cible, variations, tendances et score synthétique."],
  ["⌁", "Contexte utile", "Journalise repas, activité et insuline pour enrichir la lecture."],
  ["✦", "IA maîtrisée", "Interroge l’instance Ollama que tu as configurée pour Diabia."],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb]">
      <div className="absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_85%_5%,rgba(34,211,238,0.13),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-xl"><i className="size-2 rounded-full bg-emerald-400" />Tes données, simplement</span>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-7xl">Comprendre sa glycémie devient plus clair.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Diabia transforme tes mesures en tendances lisibles, observations prudentes et repères utiles au quotidien.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ROUTES.dashboard} className="rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-700">Ouvrir mon tableau de bord</Link>
              <Link href={ROUTES.import} className="rounded-2xl border border-white/80 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5">Importer mes données</Link>
            </div>
          </div>
          <div className="relative rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-[0_40px_100px_-40px_rgba(15,23,42,0.8)] sm:p-8">
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-blue-500/30 blur-3xl" />
            <p className="text-sm text-slate-400">Exemple d’aperçu Diabia</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5"><p className="text-sm text-slate-400">Score Diabia</p><p className="mt-2 text-5xl font-semibold">84</p></div>
              <div className="rounded-3xl bg-emerald-400 p-5 text-slate-950"><p className="text-sm font-medium opacity-70">Dans la cible</p><p className="mt-2 text-5xl font-semibold">78%</p></div>
            </div>
            <div className="mt-3 rounded-3xl bg-white/5 p-5"><div className="flex h-24 items-end gap-2">{[32, 52, 44, 76, 58, 82, 68, 90, 63, 72].map((height, index) => <i key={index} className="flex-1 rounded-full bg-blue-400/70" style={{ height: `${height}%` }} />)}</div></div>
          </div>
        </section>
        <section className="mt-20 grid gap-4 md:grid-cols-3">{features.map(([icon, title, text]) => <article key={title} className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.4)] backdrop-blur-xl"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700">{icon}</span><h2 className="mt-5 text-xl font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}</section>
        <p className="mt-10 text-center"><Link href={ROUTES.presentation} className="text-sm font-semibold text-blue-700">Découvrir le fonctionnement de Diabia →</Link></p>
      </div>
    </main>
  );
}
