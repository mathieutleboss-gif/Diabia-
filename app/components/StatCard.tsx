type StatCardProps = {
  titre: string;
  valeur: string | number;
  couleur?: string;
  icone?: string;
};

export default function StatCard({
  titre,
  valeur,
  couleur = "text-blue-600",
  icone = "📊",
}: StatCardProps) {

  return (

    <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">

      <div className="flex items-center gap-3">

        <span className="text-2xl">
          {icone}
        </span>

        <h2 className="font-bold text-gray-700">
          {titre}
        </h2>

      </div>


      <p className={`text-3xl mt-4 font-bold ${couleur}`}>
        {valeur}
      </p>


    </div>

  );
}