import Link from "next/link";

export default function Presentation() {

  return (
    <main className="min-h-screen bg-blue-50 p-8">

      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">

        <h1 className="text-4xl font-bold text-blue-600">
          Bienvenue sur Diabia
        </h1>

        <p className="mt-6">
          Diabia analyse vos données de diabète pour
          vous aider à comprendre vos tendances.
        </p>

        <h2 className="text-xl font-bold mt-6">
          Fonctionnalités :
        </h2>

        <ul className="mt-4">
          <li>📊 Analyse des données</li>
          <li>📈 Suivi des tendances</li>
          <li>🤖 Explications intelligentes</li>
        </ul>

        <Link
          href="/import"
          className="inline-block mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Voir mon analyse
        </Link>

      </div>

    </main>
  );
}