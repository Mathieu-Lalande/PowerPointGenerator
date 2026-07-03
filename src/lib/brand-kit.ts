import type { BrandKit } from "@/types/slide";

const BRAND_KIT_KEY = "slidecraft:brandkit";

export function saveGlobalBrandKit(kit: BrandKit) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(kit));
  } catch {
    // localStorage full/unavailable: not critical, fail silently.
  }
}

export function loadGlobalBrandKit(): BrandKit | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(BRAND_KIT_KEY);
    return raw ? (JSON.parse(raw) as BrandKit) : undefined;
  } catch {
    return undefined;
  }
}

export function clearGlobalBrandKit() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BRAND_KIT_KEY);
}
