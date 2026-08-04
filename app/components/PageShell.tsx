import Link from "next/link";
import { ROUTES } from "../../lib/routes";

export function PageShell({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_15%_5%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(139,92,246,0.10),transparent_28%)]" />
      <div className={`relative mx-auto w-full ${width} px-4 py-8 sm:px-6 sm:py-12 lg:px-8`}>
        {children}
      </div>
    </main>
  );
}

export function PageHero({ eyebrow, title, description, backHref = ROUTES.dashboard }: { eyebrow: string; title: string; description: string; backHref?: string }) {
  return (
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
      </div>
      <Link href={backHref} className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-blue-700">
        ← Tableau de bord
      </Link>
    </header>
  );
}

export function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 ${className}`}>{children}</section>;
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint && <span className="ml-2 text-xs text-slate-400">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export const fieldClassName = "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";
export const primaryButtonClassName = "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
