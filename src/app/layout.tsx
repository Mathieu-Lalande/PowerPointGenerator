import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="fr" className={poppins.variable}>
      <body className="min-h-screen bg-canvas bg-radial-fade font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
