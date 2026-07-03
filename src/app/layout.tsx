import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideCraft AI — Créez des présentations pro en quelques secondes",
  description:
    "Transformez vos idées, notes et comptes-rendus en présentations PowerPoint professionnelles grâce à l'IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-canvas bg-radial-fade font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
