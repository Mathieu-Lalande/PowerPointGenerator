import type { GenerateRequest, Theme } from "@/types/slide";

const KIND_LABELS: Record<GenerateRequest["inputKind"], string> = {
  notes: "des notes en vrac",
  idea: "une idée à développer",
  meeting: "un compte-rendu de réunion",
  raw: "un texte source",
};

export function buildSystemPrompt(theme: Theme, req: GenerateRequest): string {
  return `Tu es un consultant expert en storytelling et en création de présentations PowerPoint professionnelles.
Tu transformes n'importe quel contenu brut en un plan de slides clair, structuré et percutant, prêt à être mis en forme.
Style visé : ${theme.name} (${theme.description}).
Règles :
- Structure obligatoire : une slide de titre, éventuellement des slides "section" pour séparer les parties, un corps développé, une slide de clôture ("closing") avec les prochaines étapes.
- Varie les layouts (title-bullets, two-column, quote, chart, image-text) selon le contenu, n'utilise pas que des listes à puces.
- Si le contenu contient des chiffres, des tendances ou des comparaisons, crée au moins une slide de type "chart" avec des données réalistes extraites du texte.
- Bullets courtes et percutantes (pas de phrases longues), 3 à 5 par slide maximum.
- Rédige dans la langue: ${req.language}.
- Ajoute une icône professionnelle pertinente (champ icon, uniquement parmi la liste fournie) sur les slides qui en bénéficient, et des notes orateur courtes pour chaque slide.
- Génère environ ${req.slideCount} slides.`;
}

export function buildUserMessage(req: GenerateRequest): string {
  return `Voici ${KIND_LABELS[req.inputKind]} à transformer en présentation :\n\n${req.sourceText}`;
}
