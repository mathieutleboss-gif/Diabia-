"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Mesure } from "../../../lib/analyses/types";

type GlucoseChartProps = { mesures: Mesure[] };

type TooltipValue = number | string | ReadonlyArray<number | string> | undefined;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: TooltipValue }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/80 bg-slate-950/90 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-xs text-slate-300">{label || "Mesure"}</p>
      <p className="mt-1 text-lg font-semibold">{String(payload[0]?.value ?? "—")} mg/dL</p>
    </div>
  );
}

export default function GlucoseChart({ mesures }: GlucoseChartProps) {
  const donnees = mesures
    .map((mesure, index) => ({
      ...mesure,
      index,
      glycemie: Number(mesure.glycemie),
      libelle: mesure.heure || mesure.date || `#${index + 1}`,
    }))
    .filter((mesure) => Number.isFinite(mesure.glycemie));

  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Évolution</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Courbe glycémique</h2>
          <p className="mt-1 text-sm text-slate-500">Zone cible visualisée entre 70 et 180 mg/dL.</p>
        </div>
        <div className="flex gap-3 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" />Glycémie</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-400" />Cible</span>
        </div>
      </div>

      {donnees.length ? (
        <div className="mt-7 h-[320px] w-full sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={donnees} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 6" vertical={false} />
              <ReferenceArea y1={70} y2={180} fill="#10b981" fillOpacity={0.07} />
              <ReferenceLine y={70} stroke="#34d399" strokeDasharray="4 5" />
              <ReferenceLine y={180} stroke="#34d399" strokeDasharray="4 5" />
              <XAxis dataKey="libelle" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={32} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["dataMin - 20", "dataMax + 20"]} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />
              <Line
                type="monotone"
                dataKey="glycemie"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-7 grid h-72 place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
          <div>
            <span className="text-3xl">⌁</span>
            <p className="mt-3 font-medium text-slate-700">Aucune courbe disponible</p>
            <p className="mt-1 text-sm text-slate-400">Importe ou ajoute une mesure pour commencer.</p>
          </div>
        </div>
      )}
    </section>
  );
}
