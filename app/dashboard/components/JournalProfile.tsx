import Link from "next/link";
import type { JournalEntry, ProfilDiabia } from "../../../lib/analyses/types";
import { ROUTES } from "../../../lib/routes";

type JournalProfileProps = {
  journal: JournalEntry[];
  profil: ProfilDiabia;
};

const eventIcons: Record<string, string> = {
  Repas: "🍽",
  Insuline: "💉",
  Activité: "⌁",
};

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      </div>
      <Link href={href} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
        {linkLabel} →
      </Link>
    </div>
  );
}

export default function JournalProfile({ journal, profil }: JournalProfileProps) {
  const recents = journal.slice(-5).reverse();
  const profileItems = [
    ["Type de diabète", profil.diabete || "Non renseigné"],
    ["Appareil", profil.appareil || "Non renseigné"],
    ["Objectif", profil.objectif || "Non renseigné"],
  ];

  return (
    <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] sm:p-7">
        <SectionHeading eyebrow="Contexte" title="Journal récent" href={ROUTES.journal} linkLabel="Ajouter" />
        <div className="mt-6 space-y-3">
          {recents.length ? (
            recents.map((item, index) => (
              <div key={`${item.date}-${item.heure}-${index}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3.5">
                <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-lg shadow-sm">
                  {eventIcons[item.type || ""] || "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.type || "Événement"}</p>
                    <time className="shrink-0 text-xs font-medium text-slate-400">{item.heure || item.date || ""}</time>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{item.description || "Aucune description"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
              <p className="font-medium text-slate-700">Aucun événement enregistré</p>
              <p className="mt-1 text-sm text-slate-400">Ajoute un repas, une injection ou une activité.</p>
            </div>
          )}
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.4)] sm:p-7">
        <div className="absolute -right-16 -top-12 size-44 rounded-full bg-violet-100/80 blur-3xl" />
        <div className="relative">
          <SectionHeading eyebrow="Personnalisation" title="Mon profil" href={ROUTES.profil} linkLabel="Modifier" />
          <dl className="mt-6 space-y-3">
            {profileItems.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white/70 px-4 py-3.5">
                <dt className="text-xs font-medium text-slate-400">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-5 text-slate-400">
            Ces informations permettent de contextualiser les explications de Diabia. Elles restent stockées dans ton navigateur.
          </p>
        </div>
      </article>
    </section>
  );
}
