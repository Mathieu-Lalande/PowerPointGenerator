import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionCallingMode,
  type Schema,
  type FunctionDeclarationSchema,
} from "@google/generative-ai";
import type { GenerateRequest, GenerateResponse, Slide, Theme } from "@/types/slide";
import { getTheme } from "@/lib/themes";
import { ALL_ICON_IDS } from "@/lib/icons";
import { buildSystemPrompt, buildUserMessage } from "@/lib/presentation-prompt";

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY manquante. Ajoutez-la dans votre fichier .env.local."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

const stringEnum = (values: string[]): Schema => ({
  type: SchemaType.STRING,
  format: "enum",
  enum: values,
});

const stringArray: Schema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };

const bulletsSchema = (min: number, description: string): Schema => ({
  type: SchemaType.ARRAY,
  items: { type: SchemaType.STRING },
  minItems: min,
  description,
});

const SLIDE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    layout: stringEnum([
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
    ]),
    title: { type: SchemaType.STRING },
    subtitle: { type: SchemaType.STRING },
    bullets: bulletsSchema(
      4,
      "4 ou 5 bullets informatives (8 à 14 mots chacune), jamais moins de 4. Pour layout=agenda, chaque bullet est le titre court d'une partie de la présentation."
    ),
    leftBullets: bulletsSchema(3, "3 à 4 bullets informatives (8 à 14 mots chacune)."),
    rightBullets: bulletsSchema(3, "3 à 4 bullets informatives (8 à 14 mots chacune)."),
    leftTitle: {
      type: SchemaType.STRING,
      description: "Uniquement pour layout=comparison : titre court de l'option/scénario de gauche.",
    },
    rightTitle: {
      type: SchemaType.STRING,
      description: "Uniquement pour layout=comparison : titre court de l'option/scénario de droite.",
    },
    body: { type: SchemaType.STRING },
    quoteAuthor: { type: SchemaType.STRING },
    statValue: {
      type: SchemaType.STRING,
      description: "Uniquement pour layout=stat : le chiffre clé à mettre en avant (ex: '87%', '3,2M€').",
    },
    statLabel: {
      type: SchemaType.STRING,
      description: "Uniquement pour layout=stat : légende courte expliquant le chiffre.",
    },
    teamMembers: {
      type: SchemaType.ARRAY,
      description: "Uniquement pour layout=team : liste des membres de l'équipe présentés.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
        },
        required: ["name", "role"],
      },
    },
    icon: stringEnum(ALL_ICON_IDS),
    chart: {
      type: SchemaType.OBJECT,
      properties: {
        type: stringEnum(["bar", "line", "pie", "donut"]),
        categories: stringArray,
        series: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              values: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
            },
            required: ["name", "values"],
          },
        },
      },
    },
    diagramCode: {
      type: SchemaType.STRING,
      description:
        "Uniquement pour layout=diagram : code Mermaid valide (flowchart TD, sequenceDiagram, ou classDiagram) représentant un processus, un workflow, une architecture ou un parcours utilisateur. Reste simple : 4 à 8 nœuds/étapes maximum.",
    },
    notes: { type: SchemaType.STRING },
  },
  required: ["layout"],
};

const PRESENTATION_SCHEMA: FunctionDeclarationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    slides: { type: SchemaType.ARRAY, items: SLIDE_SCHEMA, minItems: 4 },
  },
  required: ["title", "slides"],
};

export async function generatePresentation(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const theme = getTheme(req.themeId);
  const genAI = client();

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(theme, req),
    tools: [
      {
        functionDeclarations: [
          {
            name: "build_presentation",
            description:
              "Construit le plan structuré d'une présentation PowerPoint professionnelle à partir du contenu fourni par l'utilisateur.",
            parameters: PRESENTATION_SCHEMA,
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
        allowedFunctionNames: ["build_presentation"],
      },
    },
  });

  const result = await model.generateContent(buildUserMessage(req));
  const call = result.response.functionCalls()?.[0];

  if (!call) {
    throw new Error("Gemini n'a pas retourné de structure exploitable.");
  }

  const input = call.args as { title: string; slides: Slide[] };

  const slides: Slide[] = input.slides.map((s, i) => ({
    ...s,
    id: `slide-${i}-${Date.now()}`,
  }));

  return { title: input.title, slides };
}

export async function regenerateSlide(
  slide: Slide,
  theme: Theme,
  language: string,
  instruction?: string
): Promise<Slide> {
  const genAI = client();

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `Tu es un directeur artistique et consultant senior spécialisé dans les présentations PowerPoint haut de gamme. Style visé : ${theme.name} (${theme.description}). Rédige dans la langue: ${language}. Respecte les mêmes règles de densité que pour une présentation complète (bullets informatives de 8 à 14 mots, jamais de contenu vide).`,
    tools: [
      {
        functionDeclarations: [
          {
            name: "rewrite_slide",
            description:
              "Reformule ou améliore le contenu d'une seule slide de présentation, en conservant son layout sauf si un meilleur layout est explicitement demandé.",
            parameters: SLIDE_SCHEMA as FunctionDeclarationSchema,
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
        allowedFunctionNames: ["rewrite_slide"],
      },
    },
  });

  const prompt = `Voici une slide existante d'une présentation, au format JSON :\n\n${JSON.stringify(
    slide
  )}\n\nReformule et améliore le contenu de cette slide (texte plus percutant, plus précis, mieux structuré) en conservant son layout "${slide.layout}".${
    instruction ? ` Consigne spécifique : ${instruction}` : ""
  }`;

  const result = await model.generateContent(prompt);
  const call = result.response.functionCalls()?.[0];
  if (!call) {
    throw new Error("Gemini n'a pas retourné de structure exploitable.");
  }

  const input = call.args as Slide;
  return { ...input, id: slide.id };
}
