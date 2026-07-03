import { NextRequest, NextResponse } from "next/server";
import { imageSearchAvailable, searchImages } from "@/lib/image-search";

export async function GET(request: NextRequest) {
  if (!imageSearchAvailable()) {
    return NextResponse.json(
      { error: "Recherche d'images non configurée (UNSPLASH_ACCESS_KEY ou PEXELS_API_KEY manquante)." },
      { status: 500 }
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Paramètre de recherche manquant." }, { status: 400 });
  }

  try {
    const results = await searchImages(q);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
