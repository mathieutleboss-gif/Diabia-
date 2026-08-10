import Link from "next/link";
import type { RapportDiabia } from "../../../lib/analyses/types";
import { ROUTES } from "../../../lib/routes";

type InsightsPanelProps = {
  analyse: RapportDiabia;
  hasData: boolean;
};

function InsightGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "attention" | "neutral";
}) {
  const styles = {
    positive: { icon: "✓", iconStyle: "bg-emerald-100 text-emerald-700", border: "border-emerald-100" },
    attention: { icon: "!", iconStyle: "bg-amber-100 text-amber-700", border: "border-amber-100" },
    neutral: { icon: "✦", iconStyle: "bg-blue-100 text-blue-700", border: "border-blue-100" },
  }[tone];

  return (
    <div className={`rounded-3xl border ${styles.border} bg-white/70 p-5`}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`grid size-9 place-items-center rounded-xl text-sm font-bold ${styles.iconStyle}`}>
          {styles.icon}
        </span>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
        {items.length ? (
          items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-slate-400">Aucune observation pour le moment.</li>
        )}
      </ul>
    </div>
  );
}

export default function InsightsPanel({ analyse, hasData }: InsightsPanelProps) {
  if (!hasData) {
    return (
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Analyse Diabia</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Tes observations apparaîtront ici</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Enregistre quelques mesures pour permettre à Diabia d’identifier les tendances, les points positifs et les périodes à surveiller.
        </p>
        <Link href={ROUTES.import} className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Importer des données
        </Link>
      </section>
    );
  }

  const observations = Array.from(new Set(analyse.insights.remarques));
  const avance = analyse.avance;
  const formater = (items: typeof avance.pointsPositifs) => items.map((item) => `${item.conclusion} — Confiance ${item.confiance}.`);
  const pointsPositifs = formater(avance.pointsPositifs);
  const pointsPreoccupants = formater(avance.pointsPreoccupants);
  const tendances = formater(avance.tendances);
  const correlations = avance.correlations.map((item) => `${item.conclusion} — Confiance ${item.confiance}.`);
  const conseils = formater(avance.conseils);

  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Analyse Diabia</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ce que tes données racontent</h2>
          <p className="mt-1 text-sm text-slate-500">Observations automatiques, informatives et non médicales.</p>
        </div>
        <Link href={ROUTES.assistant} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700">
          Demander à Diabia <span aria-hidden>→</span>
        </Link>
      </div>

      {avance.alertesSecurite.length > 0 && <div className="mt-6 space-y-3">{avance.alertesSecurite.map((alerte) => <div key={alerte.titre} role="alert" className={`rounded-3xl border p-5 ${alerte.niveau === "urgente" ? "border-red-200 bg-red-50 text-red-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-semibold">{alerte.titre}</p><p className="mt-2 text-sm leading-6">{alerte.message}</p><p className="mt-2 text-xs opacity-75">{alerte.preuves.join(" · ")}</p></div>)}</div>}

      <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-900">Qualité des données</h3><span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">Confiance {avance.qualite.niveau}</span></div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{avance.resumeGeneral}</p>
        {avance.qualite.limites.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">{avance.qualite.limites.map((limite) => <li key={limite}>{limite}</li>)}</ul>}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <InsightGroup title="Points positifs" items={pointsPositifs.length ? pointsPositifs : analyse.explication.positif} tone="positive" />
        <InsightGroup title="Points préoccupants" items={pointsPreoccupants.length ? pointsPreoccupants : analyse.explication.problemes} tone="attention" />
        <InsightGroup title="Tendances détectées" items={tendances.length ? tendances : observations} tone="neutral" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InsightGroup title="Corrélations découvertes" items={correlations} tone="neutral" />
        <InsightGroup
          title="Conseils Diabia"
          items={conseils.length ? conseils : analyse.explication.conseils}
          tone="neutral"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <InsightGroup title="Priorités à travailler" items={formater(avance.priorites)} tone="attention" />
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-slate-200 text-sm font-bold text-slate-700">
              ≋
            </span>
            <h3 className="font-semibold text-slate-900">Analyse détaillée</h3>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
            {analyse.message}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-950 px-5 py-4 text-sm leading-6 text-slate-200">
        <span className="mr-2 font-semibold text-white">Journal analysé</span>
        {analyse.journal.message}
      </div>
    </section>
  );
}
