import type { GenerateRequest, GenerateResponse, Slide, Theme } from "@/types/slide";
import { sanitizeSlides } from "@/lib/sanitize-slides";

type AiProvider = "anthropic" | "gemini";

function resolveProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" || explicit === "gemini") return explicit;
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "anthropic";
}

export async function generatePresentation(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const result =
    resolveProvider() === "gemini"
      ? await (await import("@/lib/gemini")).generatePresentation(req)
      : await (await import("@/lib/anthropic")).generatePresentation(req);

  return { ...result, slides: sanitizeSlides(result.slides) };
}

export async function regenerateSlide(
  slide: Slide,
  theme: Theme,
  language: string,
  instruction?: string
): Promise<Slide> {
  return resolveProvider() === "gemini"
    ? await (await import("@/lib/gemini")).regenerateSlide(slide, theme, language, instruction)
    : await (await import("@/lib/anthropic")).regenerateSlide(slide, theme, language, instruction);
}
