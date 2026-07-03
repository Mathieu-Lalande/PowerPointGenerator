import Anthropic from "@anthropic-ai/sdk";
import type { GenerateRequest, GenerateResponse, Slide } from "@/types/slide";
import { getTheme } from "@/lib/themes";
import { ALL_ICON_IDS } from "@/lib/icons";
import { buildSystemPrompt, buildUserMessage } from "@/lib/presentation-prompt";

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

const SLIDE_ITEM_SCHEMA = {
  type: "object" as const,
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
        "diagram",
        "agenda",
        "stat",
        "comparison",
        "team",
        "closing",
      ],
    },
    title: { type: "string" },
    subtitle: { type: "string" },
    bullets: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      description:
        "4 ou 5 bullets informatives (8 à 14 mots chacune), jamais moins de 4. Pour layout=agenda, chaque bullet est le titre court d'une partie de la présentation.",
    },
    leftBullets: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      description: "3 à 4 bullets informatives (8 à 14 mots chacune).",
    },
    rightBullets: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      description: "3 à 4 bullets informatives (8 à 14 mots chacune).",
    },
    leftTitle: {
      type: "string",
      description: "Uniquement pour layout=comparison : titre court de l'option/scénario de gauche.",
    },
    rightTitle: {
      type: "string",
      description: "Uniquement pour layout=comparison : titre court de l'option/scénario de droite.",
    },
    body: { type: "string" },
    quoteAuthor: { type: "string" },
    statValue: {
      type: "string",
      description: "Uniquement pour layout=stat : le chiffre clé à mettre en avant (ex: '87%', '3,2M€').",
    },
    statLabel: {
      type: "string",
      description: "Uniquement pour layout=stat : légende courte expliquant le chiffre.",
    },
    teamMembers: {
      type: "array",
      description: "Uniquement pour layout=team : liste des membres de l'équipe présentés.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
        },
        required: ["name", "role"],
      },
    },
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
    diagramCode: {
      type: "string",
      description:
        "Uniquement pour layout=diagram : code Mermaid valide (flowchart TD, sequenceDiagram, ou classDiagram) représentant un processus, un workflow, une architecture ou un parcours utilisateur. Reste simple : 4 à 8 nœuds/étapes maximum.",
    },
    notes: {
      type: "string",
      description: "Notes de présentation (parlé) pour l'orateur",
    },
  },
  required: ["layout"],
};

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
        items: SLIDE_ITEM_SCHEMA,
      },
    },
    required: ["title", "slides"],
  },
};

const SLIDE_TOOL = {
  name: "rewrite_slide",
  description: "Reformule ou améliore le contenu d'une seule slide de présentation, en conservant son layout sauf si un meilleur layout est explicitement demandé.",
  input_schema: SLIDE_ITEM_SCHEMA,
};

export async function generatePresentation(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const theme = getTheme(req.themeId);
  const anthropic = client();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [PRESENTATION_TOOL],
    tool_choice: { type: "tool", name: "build_presentation" },
    system: buildSystemPrompt(theme, req),
    messages: [
      {
        role: "user",
        content: buildUserMessage(req),
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

export async function regenerateSlide(
  slide: Slide,
  theme: import("@/types/slide").Theme,
  language: string,
  instruction?: string
): Promise<Slide> {
  const anthropic = client();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1536,
    tools: [SLIDE_TOOL],
    tool_choice: { type: "tool", name: "rewrite_slide" },
    system: `Tu es un directeur artistique et consultant senior spécialisé dans les présentations PowerPoint haut de gamme. Style visé : ${theme.name} (${theme.description}). Rédige dans la langue: ${language}. Respecte les mêmes règles de densité que pour une présentation complète (bullets informatives de 8 à 14 mots, jamais de contenu vide).`,
    messages: [
      {
        role: "user",
        content: `Voici une slide existante d'une présentation, au format JSON :\n\n${JSON.stringify(
          slide
        )}\n\nReformule et améliore le contenu de cette slide (texte plus percutant, plus précis, mieux structuré) en conservant son layout "${slide.layout}".${
          instruction ? ` Consigne spécifique : ${instruction}` : ""
        }`,
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude n'a pas retourné de structure exploitable.");
  }

  const input = toolUse.input as Slide;
  return { ...input, id: slide.id };
}
