"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "../../lib/routes";

const links = [
  ["Tableau de bord", ROUTES.dashboard],
  ["Mesures", ROUTES.mesures],
  ["Importer", ROUTES.import],
  ["Journal", ROUTES.journal],
  ["Assistant", ROUTES.assistant],
  ["Profil", ROUTES.profil],
];

export default function Header() {
  const pathname = usePathname();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const navigation = (mobile = false) => links.map(([label, href]) => (
    <Link key={href} href={href} onClick={() => setMenuOuvert(false)} aria-current={pathname === href ? "page" : undefined} className={`${mobile ? "px-4 py-3" : "px-3 py-2"} rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${pathname === href ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white hover:text-blue-700"}`}>{label}</Link>
  ));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <Link href={ROUTES.accueil} className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-blue-500/20">D</span>
          <span className="text-xl">Diabia</span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100/80 p-1 md:flex" aria-label="Navigation principale">{navigation()}</nav>
        <button type="button" aria-expanded={menuOuvert} aria-controls="navigation-mobile" onClick={() => setMenuOuvert(!menuOuvert)} className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-800 md:hidden"><span className="sr-only">{menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}</span>{menuOuvert ? "×" : "☰"}</button>
      </div>
      {menuOuvert && <nav id="navigation-mobile" aria-label="Navigation mobile" className="grid gap-1 border-t border-slate-100 bg-white p-3 md:hidden">{navigation(true)}</nav>}
    </header>
  );
}
