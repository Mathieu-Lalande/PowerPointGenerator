import type { GenerateRequest, GenerateResponse } from "@/types/slide";

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
  if (resolveProvider() === "gemini") {
    const { generatePresentation: generate } = await import("@/lib/gemini");
    return generate(req);
  }
  const { generatePresentation: generate } = await import("@/lib/anthropic");
  return generate(req);
}
