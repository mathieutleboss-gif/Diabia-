type Props = {
  score: number;
  cible: number;
  hyper: number;
  hypo: number;
};

function Card({
  titre,
  valeur,
  couleur,
}: {
  titre: string;
  valeur: string;
  couleur: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all">

      <p className="text-gray-500 text-sm">
        {titre}
      </p>

      <h2 className={`text-4xl font-bold mt-3 ${couleur}`}>
        {valeur}
      </h2>

    </div>
  );
}

export default function DashboardCards({
  score,
  cible,
  hyper,
  hypo,
}: Props) {

  return (

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

      <Card
        titre="⭐ Score Diabia"
        valeur={`${score}/100`}
        couleur="text-blue-600"
      />

      <Card
        titre="🎯 Temps cible"
        valeur={`${cible}%`}
        couleur="text-green-600"
      />

      <Card
        titre="🔴 Hyper"
        valeur={`${hyper}%`}
        couleur="text-orange-500"
      />

      <Card
        titre="🟣 Hypo"
        valeur={`${hypo}%`}
        couleur="text-red-500"
      />

    </div>

  );

}