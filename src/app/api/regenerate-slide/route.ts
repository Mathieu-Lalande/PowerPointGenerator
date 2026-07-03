import { NextRequest, NextResponse } from "next/server";
import { regenerateSlide } from "@/lib/ai-provider";
import { getTheme } from "@/lib/themes";
import type { Slide } from "@/types/slide";

interface RegenerateRequest {
  slide: Slide;
  themeId: string;
  language: string;
  instruction?: string;
}

export async function POST(request: NextRequest) {
  let body: RegenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!body.slide?.layout) {
    return NextResponse.json({ error: "Slide invalide." }, { status: 400 });
  }

  try {
    const theme = getTheme(body.themeId);
    const slide = await regenerateSlide(body.slide, theme, body.language || "français", body.instruction);
    return NextResponse.json({ slide });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    const isConfigError = message.includes("ANTHROPIC_API_KEY") || message.includes("GEMINI_API_KEY");
    const status = isConfigError ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
