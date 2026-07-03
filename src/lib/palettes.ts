import type { ColorPalette } from "@/types/slide";

export const PALETTES: ColorPalette[] = [
  { id: "ocean", name: "Ocean", colors: ["#0F3D91", "#1B5FBF", "#39B7D0", "#8FE3E8", "#F2A93B"] },
  { id: "sunset", name: "Sunset", colors: ["#E8562F", "#F2994A", "#FFD166", "#FFF3B0", "#2B1B12"] },
  { id: "forest", name: "Forêt", colors: ["#0B4F3C", "#1F7A5C", "#7FB88B", "#D4AF37", "#1B2B24"] },
  { id: "neon", name: "Néon Nuit", colors: ["#7C5CFF", "#39D0D8", "#FF5C8A", "#F5F5FF", "#0B0B12"] },
  { id: "mono", name: "Mono Contrasté", colors: ["#111111", "#444444", "#8A8A8A", "#C9FF3D", "#FFFFFF"] },
  { id: "berry", name: "Berry", colors: ["#D6006B", "#8A2C6B", "#FFE156", "#1A1A2E", "#FFFFFF"] },
  { id: "sand", name: "Sable & Terracotta", colors: ["#B5651D", "#E0A96D", "#F4E1C1", "#5C3D2E", "#FFFFFF"] },
  { id: "slate", name: "Slate Corporate", colors: ["#1E293B", "#334155", "#64748B", "#38BDF8", "#F8FAFC"] },
];

export function getPalette(id: string): ColorPalette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
