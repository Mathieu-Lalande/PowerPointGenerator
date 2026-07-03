import { NextRequest, NextResponse } from "next/server";
import { generatePresentation } from "@/lib/anthropic";
import type { GenerateRequest } from "@/types/slide";

export async function POST(request: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!body.sourceText || body.sourceText.trim().length < 10) {
    return NextResponse.json(
      { error: "Merci de fournir un texte source plus détaillé (min. 10 caractères)." },
      { status: 400 }
    );
  }

  try {
    const result = await generatePresentation(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    const status = message.includes("ANTHROPIC_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
