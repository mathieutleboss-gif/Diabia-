type ScoreCardProps = {
  score: number;
  moyenne: number;
  maximum: number;
  minimum: number;
  hasData: boolean;
};

function scoreLabel(score: number) {
  if (score >= 85) return "Très bon équilibre";
  if (score >= 70) return "Équilibre encourageant";
  if (score >= 50) return "Marge de progression";
  return "Points d’attention";
}

export default function ScoreCard({
  score,
  moyenne,
  maximum,
  minimum,
  hasData,
}: ScoreCardProps) {
  const angle = hasData ? Math.max(0, Math.min(100, score)) * 3.6 : 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-8">
      <div className="absolute right-0 top-0 size-36 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between gap-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Indicateur interne
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Score Diabia
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Synthèse de la période analysée
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Non médical
          </span>
        </div>

        <div className="flex flex-col items-center gap-7 sm:flex-row">
          <div
            className="grid size-44 shrink-0 place-items-center rounded-full p-3 shadow-inner"
            style={{
              background: `conic-gradient(#2563eb ${angle}deg, #dbeafe ${angle}deg)`,
            }}
          >
            <div className="grid size-full place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.15)]">
              <div className="text-center">
                <strong className="block text-5xl font-semibold tracking-[-0.06em] text-slate-950">
                  {hasData ? score : "—"}
                </strong>
                <span className="text-sm font-medium text-slate-400">sur 100</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <p className="text-lg font-semibold text-slate-900">
              {hasData ? scoreLabel(score) : "Ajoute des données pour commencer"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {hasData
                ? "Ce score combine le temps dans la cible, les épisodes hors cible et les variations importantes."
                : "Le score ne sera affiché qu’après l’enregistrement d’au moins une mesure."}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["Moyenne", moyenne, "mg/dL"],
                ["Minimum", minimum, "mg/dL"],
                ["Maximum", maximum, "mg/dL"],
              ].map(([label, value, unit]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
                  <dt className="text-[11px] font-medium text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {hasData ? value : "—"} <span className="text-[10px] font-medium text-slate-400">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
