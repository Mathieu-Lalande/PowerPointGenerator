import Anthropic from "@anthropic-ai/sdk";
import type { GenerateRequest, GenerateResponse, Slide } from "@/types/slide";
import { getTheme } from "@/lib/themes";
import { ALL_ICON_IDS } from "@/lib/icons";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY manquante. Ajoutez-la dans votre fichier .env.local."
    );
  }
  return new Anthropic({ apiKey });
}

const PRESENTATION_TOOL = {
  name: "build_presentation",
  description:
    "Construit le plan structuré d'une présentation PowerPoint professionnelle à partir du contenu fourni par l'utilisateur.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Titre général de la présentation" },
      slides: {
        type: "array",
        minItems: 4,
        items: {
          type: "object",
          properties: {
            layout: {
              type: "string",
              enum: [
                "title",
                "section",
                "title-bullets",
                "two-column",
                "quote",
                "chart",
                "image-text",
                "closing",
              ],
            },
            title: { type: "string" },
            subtitle: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            leftBullets: { type: "array", items: { type: "string" } },
            rightBullets: { type: "array", items: { type: "string" } },
            body: { type: "string" },
            quoteAuthor: { type: "string" },
            icon: {
              type: "string",
              enum: ALL_ICON_IDS,
              description:
                "Identifiant d'une icône professionnelle pertinente pour illustrer la slide (facultatif, à choisir uniquement dans cette liste)",
            },
            chart: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["bar", "line", "pie", "donut"] },
                categories: { type: "array", items: { type: "string" } },
                series: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      values: { type: "array", items: { type: "number" } },
                    },
                    required: ["name", "values"],
                  },
                },
              },
            },
            notes: {
              type: "string",
              description: "Notes de présentation (parlé) pour l'orateur",
            },
          },
          required: ["layout"],
        },
      },
    },
    required: ["title", "slides"],
  },
};

export async function generatePresentation(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const theme = getTheme(req.themeId);
  const anthropic = client();

  const kindLabel: Record<GenerateRequest["inputKind"], string> = {
    notes: "des notes en vrac",
    idea: "une idée à développer",
    meeting: "un compte-rendu de réunion",
    raw: "un texte source",
  };

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [PRESENTATION_TOOL],
    tool_choice: { type: "tool", name: "build_presentation" },
    system: `Tu es un consultant expert en storytelling et en création de présentations PowerPoint professionnelles.
Tu transformes n'importe quel contenu brut en un plan de slides clair, structuré et percutant, prêt à être mis en forme.
Style visé : ${theme.name} (${theme.description}).
Règles :
- Structure obligatoire : une slide de titre, éventuellement des slides "section" pour séparer les parties, un corps développé, une slide de clôture ("closing") avec les prochaines étapes.
- Varie les layouts (title-bullets, two-column, quote, chart, image-text) selon le contenu, n'utilise pas que des listes à puces.
- Si le contenu contient des chiffres, des tendances ou des comparaisons, crée au moins une slide de type "chart" avec des données réalistes extraites du texte.
- Bullets courtes et percutantes (pas de phrases longues), 3 à 5 par slide maximum.
- Rédige dans la langue: ${req.language}.
- Ajoute une icône professionnelle pertinente (champ icon, uniquement parmi la liste fournie) sur les slides qui en bénéficient, et des notes orateur courtes pour chaque slide.
- Génère environ ${req.slideCount} slides.`,
    messages: [
      {
        role: "user",
        content: `Voici ${kindLabel[req.inputKind]} à transformer en présentation :\n\n${req.sourceText}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Claude n'a pas retourné de structure exploitable.");
  }

  const input = toolUse.input as { title: string; slides: Slide[] };

  const slides: Slide[] = input.slides.map((s, i) => ({
    ...s,
    id: `slide-${i}-${Date.now()}`,
  }));

  return { title: input.title, slides };
}
