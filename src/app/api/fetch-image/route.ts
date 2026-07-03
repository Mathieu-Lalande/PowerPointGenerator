import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_HOSTS, fetchImageAsDataUrl } from "@/lib/image-search";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Paramètre url manquant." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }

  // Only proxy known stock-photo CDNs — this endpoint fetches server-side on
  // the client's behalf, so an open allowlist would make it an SSRF vector.
  if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Source d'image non autorisée." }, { status: 400 });
  }

  try {
    const dataUrl = await fetchImageAsDataUrl(parsed.toString());
    return NextResponse.json({ dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
