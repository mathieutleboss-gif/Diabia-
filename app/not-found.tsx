import Link from "next/link";
import { ROUTES } from "../lib/routes";

export default function NotFound() {
  return <main id="contenu-principal" className="grid min-h-[70vh] place-items-center bg-[#f3f6fb] px-4 text-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Erreur 404</p><h1 className="mt-3 text-4xl font-semibold text-slate-950">Cette page n’existe pas</h1><p className="mt-3 text-slate-500">Le lien est peut-être ancien ou incomplet.</p><Link href={ROUTES.dashboard} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Retour au Dashboard</Link></div></main>;
}
