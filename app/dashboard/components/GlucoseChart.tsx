"use client";

import { useMemo } from "react";
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
import { trierMesuresChronologiquement } from "../../../lib/dates";
import Link from "next/link";
import { ROUTES } from "../../../lib/routes";

type GlucoseChartProps = { mesures: Mesure[] };

type TooltipValue = number | string | ReadonlyArray<number | string> | undefined;
type ChartPoint = Mesure & { index: number; glycemie: number; libelle: string };

const MAX_POINTS_AFFICHES = 600;

function reduirePourGraphique(donnees: ChartPoint[]): ChartPoint[] {
  if (donnees.length <= MAX_POINTS_AFFICHES) return donnees;

  const resultat = [donnees[0]];
  const interieur = donnees.slice(1, -1);
  const tailleSegment = Math.ceil(interieur.length / ((MAX_POINTS_AFFICHES - 2) / 2));

  for (let debut = 0; debut < interieur.length; debut += tailleSegment) {
    const segment = interieur.slice(debut, debut + tailleSegment);
    const minimum = segment.reduce((a, b) => a.glycemie <= b.glycemie ? a : b);
    const maximum = segment.reduce((a, b) => a.glycemie >= b.glycemie ? a : b);
    if (minimum.index === maximum.index) {
      resultat.push(minimum);
    } else {
      resultat.push(...(minimum.index < maximum.index ? [minimum, maximum] : [maximum, minimum]));
    }
  }

  resultat.push(donnees[donnees.length - 1]);
  return resultat;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: TooltipValue; payload?: ChartPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/80 bg-slate-950/90 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      <p className="text-xs text-slate-300">{label || "Mesure"}</p>
      <p className="mt-1 text-lg font-semibold">{String(payload[0]?.value ?? "—")} mg/dL</p>
      {payload[0]?.payload?.insuline !== undefined && Number(payload[0].payload.insuline) > 0 && <p className="mt-1 text-xs text-slate-300">Insuline : {payload[0].payload.insuline} unité(s)</p>}
      {payload[0]?.payload?.note && <p className="mt-1 max-w-56 text-xs text-slate-300">{payload[0].payload.note}</p>}
    </div>
  );
}

export default function GlucoseChart({ mesures }: GlucoseChartProps) {
  const donneesCompletes = useMemo(
    () => trierMesuresChronologiquement(mesures)
      .map((mesure, index) => ({
        ...mesure,
        index,
        glycemie: Number(mesure.glycemie),
        libelle: mesure.heure || mesure.date || `#${index + 1}`,
      }))
      .filter((mesure): mesure is ChartPoint => Number.isFinite(mesure.glycemie)),
    [mesures]
  );
  const donnees = useMemo(() => reduirePourGraphique(donneesCompletes), [donneesCompletes]);
  const statistiquesAccessibles = donneesCompletes.reduce(
    (resume, mesure) => ({
      minimum: Math.min(resume.minimum, mesure.glycemie),
      maximum: Math.max(resume.maximum, mesure.glycemie),
    }),
    { minimum: Number.POSITIVE_INFINITY, maximum: Number.NEGATIVE_INFINITY }
  );
  const resumeAccessible = donneesCompletes.length
    ? `${donneesCompletes.length} mesures. Minimum ${statistiquesAccessibles.minimum} mg/dL, maximum ${statistiquesAccessibles.maximum} mg/dL, dernière valeur ${donneesCompletes[donneesCompletes.length - 1].glycemie} mg/dL.`
    : "Aucune mesure glycémique disponible.";

  return (
    <section aria-labelledby="titre-courbe" aria-describedby="resume-courbe" className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Évolution</p>
          <h2 id="titre-courbe" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Courbe glycémique</h2>
          <p className="mt-1 text-sm text-slate-500">Zone cible visualisée entre 70 et 180 mg/dL.</p>
          <Link href={ROUTES.mesures} className="mt-2 inline-flex text-xs font-semibold text-blue-700">Voir toutes les mesures →</Link>
        </div>
        <div className="flex gap-3 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" />Glycémie</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-400" />Cible</span>
        </div>
      </div>
      <p id="resume-courbe" className="sr-only">{resumeAccessible}</p>

      {donnees.length ? (
        <div aria-hidden="true" className="mt-7 h-[320px] w-full sm:h-[380px]">
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
                type="linear"
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
