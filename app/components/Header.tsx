"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "../../lib/routes";

const links = [
  ["Dashboard", ROUTES.dashboard],
  ["Importer", ROUTES.import],
  ["Journal", ROUTES.journal],
  ["Assistant", ROUTES.assistant],
  ["Profil", ROUTES.profil],
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <Link href={ROUTES.accueil} className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-blue-500/20">D</span>
          <span className="hidden text-xl sm:inline">Diabia</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1" aria-label="Navigation principale">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                pathname === href
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-blue-700 hover:shadow-sm"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
