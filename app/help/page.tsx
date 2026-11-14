import Link from "next/link";
import { GlassPanel, PageHero, PageShell } from "../components/PageShell";
export const metadata = { title: "Guide d’utilisation" };
const etapes = [
  ["01", "Explorer sans données personnelles", "Le bouton « Charger / actualiser l’exemple fictif » prépare 28 jours de données d’exemple. Il ne remplace pas un historique personnel.", "/dashboard/", "Ouvrir le tableau de bord"],
  ["02", "Renseigner une mesure et une dose", "Choisis l’unité de glycémie, la date et l’heure. L’insuline est facultative et s’exprime en unités (U). Laisser ce champ vide signifie « non renseignée » ; zéro est une valeur distincte.", "/add-measure/", "Ajouter une mesure"],
  ["03", "Importer sans perdre l’historique", "Choisis l’unité du fichier avant de le lire. Contrôle l’aperçu et les rejets. La fusion conserve l’existant et ignore les doublons stricts ; le remplacement demande une confirmation.", "/import/", "Importer un CSV"],
  ["04", "Sauvegarder avant de changer d’appareil", "Depuis Profil, exporte un fichier JSON contenant mesures, doses, journal et profil. Le CSV de l’historique contient uniquement la sélection de mesures et ne remplace pas une sauvegarde complète.", "/profile/#donnees", "Gérer mes sauvegardes"],
];
export default function Help() {
  return <PageShell width="max-w-5xl"><PageHero eyebrow="Bien démarrer" title="Diabia, pas à pas." description="Les repères utiles pour explorer les écrans, enregistrer tes données et garder une sauvegarde." />
    <div className="grid gap-4 sm:grid-cols-2">{etapes.map(([numero,titre,texte,lien,label])=><GlassPanel key={numero}><span className="text-xs font-semibold tracking-widest text-blue-600">{numero}</span><h2 className="mt-3 text-xl font-semibold text-slate-950">{titre}</h2><p className="mt-3 text-sm leading-7 text-slate-500">{texte}</p><Link href={lien} className="mt-5 inline-flex text-sm font-semibold text-blue-700">{label} →</Link></GlassPanel>)}</div>
    <GlassPanel className="mt-6"><h2 className="text-2xl font-semibold text-slate-950">Les réponses aux questions courantes</h2><div className="mt-5 divide-y divide-slate-100">{[
      ["Pourquoi l’assistant ne répond-il pas encore ?", "L’assistant distant est en attente de configuration. Il ne reçoit actuellement aucune mesure, aucun profil et aucun texte du journal. Les réponses IA sur les données réelles ne sont pas activées dans cette version."],
      ["Le total d’insuline représente-t-il toutes mes injections ?", "Il additionne seulement les doses valides renseignées avec les mesures de la période choisie. Un événement « Insuline » écrit dans le journal n’ajoute pas automatiquement une dose au total. L’absence de dose renseignée n’indique pas l’absence d’injection."],
      ["Le score est-il une évaluation médicale ?", "Le score est un indicateur expérimental calculé par des règles internes. Il n’a pas fait l’objet d’une validation clinique. Ni ce score ni les observations ne doivent servir à décider d’une injection, à changer un traitement ou à retarder des soins."],
      ["Pourquoi je ne retrouve pas mes données ailleurs ?", "Elles sont liées au navigateur et à l’adresse du site utilisés. Une autre adresse, un autre navigateur, un autre appareil ou l’effacement du stockage ne retrouve pas automatiquement cet historique. Exporte un JSON puis restaure-le pour transférer tes données."],
      ["Que faire si l’enregistrement est bloqué ?", "Vérifie les autorisations du navigateur et l’espace disponible. Si les données sont encore lisibles, exporte une sauvegarde avant de vider un stockage. Une saisie accompagnée d’une erreur ne doit pas être considérée comme enregistrée."],
    ].map(([question,reponse])=><details key={question} className="py-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800">{question}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{reponse}</p></details>)}</div></GlassPanel>
  </PageShell>;
}
