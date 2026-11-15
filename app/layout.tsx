import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import ApplicationFrame from './components/ApplicationFrame';

export const metadata: Metadata = {
  title: { default: "Diabia — Comprendre sa glycémie", template: "%s · Diabia" },
  description: "Un tableau de bord local pour mieux comprendre ses données glycémiques.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#contenu-principal" className="sr-only z-[200] rounded-xl bg-white px-4 py-3 font-semibold text-blue-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Aller au contenu principal</a>
        <SessionProvider>
        <ApplicationFrame>{children}</ApplicationFrame>
        </SessionProvider>
      </body>
    </html>
  );
}
