import { Poppins, Space_Grotesk, Sora, Playfair_Display, Inter } from "next/font/google";

// Loaded once here (App UI + every slide theme font) so the on-screen
// preview actually renders the typeface a theme was designed with,
// instead of silently falling back to the browser's generic serif/sans.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const SLIDE_FONT_VARIABLES = [
  poppins.variable,
  spaceGrotesk.variable,
  sora.variable,
  playfairDisplay.variable,
  inter.variable,
].join(" ");

const FONT_FAMILY_CSS: Record<string, string> = {
  Poppins: "var(--font-sans), sans-serif",
  "Space Grotesk": "var(--font-space-grotesk), sans-serif",
  Sora: "var(--font-sora), sans-serif",
  "Playfair Display": "var(--font-playfair), serif",
  Inter: "var(--font-inter), sans-serif",
};

/** Resolves a theme's declared font name to the actually-loaded web font. */
export function resolveFontFamily(name: string): string {
  return FONT_FAMILY_CSS[name] ?? `${name}, sans-serif`;
}
