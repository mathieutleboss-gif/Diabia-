"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="contenu-principal" className="grid min-h-[70vh] place-items-center bg-[#f3f6fb] px-4 text-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Erreur inattendue</p><h1 className="mt-3 text-3xl font-semibold text-slate-950">Diabia n’a pas pu afficher cette page</h1><p className="mt-3 text-slate-500">Tes données locales n’ont pas été supprimées.</p><button type="button" onClick={reset} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Réessayer</button></div></main>;
}
