type Props = {
  prenom: string;
};

export default function DashboardHeader({
  prenom,
}: Props) {
  const aujourdHui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 text-white p-8 shadow-xl">

      <p className="text-sm opacity-80">
        {aujourdHui}
      </p>

      <h1 className="text-4xl font-bold mt-2">
        Bonjour {prenom} 👋
      </h1>

      <p className="mt-4 text-lg opacity-90">
        Bienvenue sur Diabia.
      </p>

      <p className="opacity-80 mt-2">
        Ton assistant intelligent pour comprendre ton diabète.
      </p>

    </div>
  );
}