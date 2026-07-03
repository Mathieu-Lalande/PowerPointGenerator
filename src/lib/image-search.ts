export interface ImageResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

type ImageProvider = "unsplash" | "pexels";

export const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com", "images.pexels.com"];

function resolveImageProvider(): ImageProvider | null {
  const explicit = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (explicit === "unsplash" || explicit === "pexels") return explicit;
  if (process.env.UNSPLASH_ACCESS_KEY) return "unsplash";
  if (process.env.PEXELS_API_KEY) return "pexels";
  return null;
}

export function imageSearchAvailable(): boolean {
  return resolveImageProvider() !== null;
}

export async function searchImages(query: string): Promise<ImageResult[]> {
  const provider = resolveImageProvider();
  if (!provider) {
    throw new Error(
      "Aucune clé API d'images configurée. Ajoutez UNSPLASH_ACCESS_KEY ou PEXELS_API_KEY dans .env.local."
    );
  }

  if (provider === "unsplash") {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=24`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) throw new Error("Erreur lors de la recherche Unsplash.");
    const data = await res.json();
    return (data.results ?? []).map((p: any) => ({
      id: String(p.id),
      thumbUrl: p.urls.small,
      fullUrl: p.urls.regular,
      alt: p.alt_description || query,
      credit: p.user?.name || "Unsplash",
      creditUrl: p.user?.links?.html || "https://unsplash.com",
    }));
  }

  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24`, {
    headers: { Authorization: process.env.PEXELS_API_KEY! },
  });
  if (!res.ok) throw new Error("Erreur lors de la recherche Pexels.");
  const data = await res.json();
  return (data.photos ?? []).map((p: any) => ({
    id: String(p.id),
    thumbUrl: p.src.medium,
    fullUrl: p.src.large,
    alt: p.alt || query,
    credit: p.photographer || "Pexels",
    creditUrl: p.photographer_url || "https://pexels.com",
  }));
}

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Impossible de récupérer l'image.");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString("base64")}`;
}
