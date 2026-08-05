import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import StorageMigration from "./components/StorageMigration";

export const metadata: Metadata = {
  title: "Diabia — Comprendre sa glycémie",
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
        <Header />
        <StorageMigration />
        {children}
      </body>
    </html>
  );
}
