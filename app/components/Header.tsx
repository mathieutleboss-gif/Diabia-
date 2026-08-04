import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Importer", "/import"],
  ["Journal", "/journal"],
  ["Assistant", "/assistant"],
  ["Profil", "/profile"],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-slate-950">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-blue-500/20">D</span>
          <span className="text-xl">Diabia</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1" aria-label="Navigation principale">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm sm:text-sm">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
