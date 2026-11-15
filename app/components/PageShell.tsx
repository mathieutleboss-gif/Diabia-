import Link from "next/link";
import { ROUTES } from "../../lib/routes";

export function PageShell({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
  return (
    <main id="contenu-principal" tabIndex={-1} className="relative flex-1 bg-[var(--background)]">
      <div className={`relative mx-auto w-full ${width} px-4 py-7 sm:px-7 sm:py-9 lg:px-9`}>
        {children}
      </div>
    </main>
  );
}

export function PageHero({ eyebrow, title, description, backHref = ROUTES.dashboard, backLabel = "Tableau de bord" }: { eyebrow: string; title: string; description: string; backHref?: string; backLabel?: string }) {
  return (
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
      </div>
      <Link href={backHref} className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-blue-700">
        ← {backLabel}
      </Link>
    </header>
  );
}

export function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`diabia-panel rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_-8px_rgba(15,23,42,0.12)] sm:p-7 ${className}`}>{children}</section>;
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint && <span className="ml-2 text-xs text-slate-500">· {hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export const fieldClassName = "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";
export const primaryButtonClassName = "inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50";
