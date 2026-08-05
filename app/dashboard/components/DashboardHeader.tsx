import Link from "next/link";
import { ROUTES } from "../../../lib/routes";

type DashboardHeaderProps = {
  prenom?: string;
  nombreMesures: number;
};

function ActionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-white/90 text-lg text-slate-900 shadow-sm">
      {children}
    </span>
  );
}

export default function DashboardHeader({
  prenom,
  nombreMesures,
}: DashboardHeaderProps) {
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.65)] sm:px-9 sm:py-9">
      <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium capitalize tracking-wide text-slate-300">
            {date}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Bonjour{prenom ? ` ${prenom}` : ""}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Une vue claire de tes données glycémiques, de tes tendances et des
            observations de Diabia.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-xl">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            {nombreMesures} mesure{nombreMesures > 1 ? "s" : ""} analysée{nombreMesures > 1 ? "s" : ""}
          </div>
        </div>

        <nav className="grid grid-cols-1 gap-2 min-[440px]:grid-cols-3 sm:flex" aria-label="Actions du tableau de bord">
          <Link
            href={ROUTES.import}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:px-4"
          >
            <ActionIcon>↥</ActionIcon>
            Importer
          </Link>
          <Link
            href={ROUTES.ajoutMesure}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15 sm:px-4"
          >
            <ActionIcon>＋</ActionIcon>
            Mesure
          </Link>
          <Link
            href={ROUTES.journal}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15 sm:px-4"
          >
            <ActionIcon>✎</ActionIcon>
            Journal
          </Link>
        </nav>
      </div>
    </section>
  );
}
