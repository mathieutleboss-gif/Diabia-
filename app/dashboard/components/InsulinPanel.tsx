"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Mesure } from "../../../lib/analyses/types";
import { formaterDose, resumerInsuline } from "../../../lib/insuline";
import { ROUTES } from "../../../lib/routes";

export default function InsulinPanel({ mesures }: { mesures: Mesure[] }) {
  const resume = useMemo(() => resumerInsuline(mesures), [mesures]);
  const derniere = resume.injections[0];
  return <section aria-labelledby="insuline-title" className="overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)]">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
      <div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m14 4 6 6M12 6l6 6M3 21l4-4m-2-2 4 4m-2-4 8-8 4 4-8 8Z"/><path d="m17 1 6 6m-3-3-3 3M10 12l2 2"/></svg></span><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-600">Suivi des injections</p><h2 id="insuline-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Ton insuline, en un regard</h2></div></div>
      <Link href={ROUTES.ajoutMesure} className="rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100">＋ Ajouter une dose avec une mesure</Link>
    </div>
    <div className="grid lg:grid-cols-[.8fr_1.2fr]">
      <div className="bg-gradient-to-br from-violet-50/80 to-white p-6 sm:p-8">
        <p className="text-sm font-medium text-slate-500">Total renseigné · période sélectionnée</p>
        <p className="mt-2 text-5xl font-semibold tracking-[-.05em] text-violet-950">{resume.renseignees ? formaterDose(resume.total) : "—"}<span className="ml-2 text-lg font-medium tracking-normal text-violet-500">U</span></p>
        <p className="mt-3 text-sm text-slate-600">{resume.injections.length} dose{resume.injections.length > 1 ? "s" : ""} positive{resume.injections.length > 1 ? "s" : ""} enregistrée{resume.injections.length > 1 ? "s" : ""}</p>
        <div className="mt-6 rounded-2xl border border-violet-100 bg-white/90 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dernière dose renseignée</p><p className="mt-2 text-xl font-semibold text-slate-900">{derniere ? `${formaterDose(derniere.dose)} U` : "Aucune dose positive"}</p><p className="mt-1 text-xs text-slate-500">{derniere ? [derniere.date || "Date non renseignée", derniere.heure].filter(Boolean).join(" · ") : "Renseigne une dose depuis Ajouter une mesure."}</p></div>
        <p className="mt-4 text-xs leading-5 text-slate-500">{resume.manquantes} mesure{resume.manquantes > 1 ? "s" : ""} sans dose valide renseignée. Ce total peut être incomplet ; une absence de donnée ne signifie pas une absence d’injection.</p>
      </div>
      <div className="min-w-0 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Unités enregistrées par jour</h3><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Insuline · U</span></div>
        <p className="mt-1 text-xs text-slate-500">{resume.jours.length > 14 ? "14 derniers jours renseignés de la période." : "Jours avec au moins une dose renseignée."}</p>
        {resume.jours.length ? <div role="img" aria-label={`Histogramme des doses renseignées par jour. Total sur la période : ${formaterDose(resume.total)} unités.`} className="mt-4 h-44 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={resume.jours.slice(-14)} margin={{ left: -22, right: 4, top: 6, bottom: 0 }}><CartesianGrid vertical={false} stroke="#f1f5f9"/><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={20} tick={{fontSize:10,fill:"#64748b"}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#64748b"}} domain={[0,"auto"]}/><Tooltip formatter={value => [`${formaterDose(Number(value))} U`, "Insuline renseignée"]} contentStyle={{borderRadius:16,border:"1px solid #ede9fe",fontSize:12}}/><Bar dataKey="total" fill="#8b5cf6" radius={[5,5,0,0]} maxBarSize={28}/></BarChart></ResponsiveContainer></div> : <div className="mt-4 grid h-44 place-items-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-5 text-center text-sm text-slate-500">Les doses datées apparaîtront ici une fois renseignées.</div>}
        {resume.injections.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-500">Dernières injections renseignées</h3><Link href={ROUTES.mesures} className="text-xs font-semibold text-violet-700">Tout voir →</Link></div><ul className="mt-3 flex flex-wrap gap-2">{resume.injections.slice(0,4).map((mesure,index) => <li key={mesure.id || index} className="rounded-xl bg-slate-50 px-3 py-2"><span className="block text-sm font-semibold text-violet-900">{formaterDose(mesure.dose)} U</span><span className="mt-1 block text-[11px] text-slate-500">{mesure.date || "Sans date"} · {mesure.heure || "—"}</span></li>)}</ul></div>}
      </div>
    </div>
    <p className="border-t border-slate-100 px-6 py-3 text-xs leading-5 text-slate-400 sm:px-8">Doses renseignées avec les mesures uniquement. Les descriptions du journal ne sont pas comptabilisées. Aucun calcul de dose à injecter.</p>
  </section>;
}
