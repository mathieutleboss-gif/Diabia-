type Metric = {
  label: string;
  value: number;
  description: string;
  color: string;
  progressColor: string;
  track: string;
  icon: string;
};

type MetricCardsProps = {
  cible: number;
  hyper: number;
  hypo: number;
  variations: number;
  hasData: boolean;
};

function MetricCard({ metric, hasData }: { metric: Metric; hasData: boolean }) {
  const progress = hasData ? Math.max(0, Math.min(100, metric.value)) : 0;

  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${metric.color}`}>
            {hasData ? metric.value : "—"}
            <span className="ml-1 text-sm font-semibold text-slate-400">
              {metric.label === "Variations" ? "pics" : "%"}
            </span>
          </p>
        </div>
        <span className={`grid size-11 place-items-center rounded-2xl text-xl ${metric.track}`}>
          {metric.icon}
        </span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${metric.progressColor}`}
          style={{ width: metric.label === "Variations" ? `${Math.min(progress * 4, 100)}%` : `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">{metric.description}</p>
    </article>
  );
}

export default function MetricCards({
  cible,
  hyper,
  hypo,
  variations,
  hasData,
}: MetricCardsProps) {
  const metrics: Metric[] = [
    {
      label: "Dans la cible",
      value: cible,
      description: "Mesures comprises entre 70 et 180 mg/dL.",
      color: "text-emerald-600",
      progressColor: "bg-emerald-500",
      track: "bg-emerald-50",
      icon: "◎",
    },
    {
      label: "Hyperglycémies",
      value: hyper,
      description: "Mesures supérieures à 180 mg/dL.",
      color: "text-amber-600",
      progressColor: "bg-amber-500",
      track: "bg-amber-50",
      icon: "↗",
    },
    {
      label: "Hypoglycémies",
      value: hypo,
      description: "Mesures inférieures à 70 mg/dL.",
      color: "text-rose-600",
      progressColor: "bg-rose-500",
      track: "bg-rose-50",
      icon: "↘",
    },
    {
      label: "Variations",
      value: variations,
      description: "Écarts consécutifs d’au moins 50 mg/dL.",
      color: "text-violet-600",
      progressColor: "bg-violet-500",
      track: "bg-violet-50",
      icon: "⌁",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} hasData={hasData} />
      ))}
    </section>
  );
}
