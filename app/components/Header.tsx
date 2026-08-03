import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow p-4">

      <div className="max-w-6xl mx-auto flex justify-between items-center">


        <Link
          href="/"
          className="text-2xl font-bold text-blue-600"
        >
          Diabia
        </Link>



        <nav className="flex gap-4">


          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>


          <Link
            href="/import"
            className="text-gray-700 hover:text-blue-600"
          >
            Import
          </Link>


          <Link
            href="/profile"
            className="text-gray-700 hover:text-blue-600"
          >
            Profil
          </Link>


        </nav>


      </div>

    </header>
  );
}