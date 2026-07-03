# SlideCraft AI

Plateforme web pour créer des présentations PowerPoint professionnelles à partir d'idées, de notes,
de comptes-rendus ou de texte libre. L'IA (Claude ou Gemini, au choix) structure et rédige les slides
selon un thème choisi ; l'éditeur intégré permet d'ajuster le contenu, les icônes, les cadres et les
couleurs avant d'exporter un vrai fichier `.pptx` éditable dans PowerPoint.

## Fonctionnalités (V1)

- **Génération IA** : collez une idée, des notes en vrac, un compte-rendu de réunion ou un texte
  libre → l'IA produit un plan de slides structuré (titre, sections, contenu, graphique, clôture).
- **Thèmes prêts à l'emploi** : 6 thèmes (Corporate, Tech, Créatif, Minimal, Élégant, Bold) avec
  typographies et palettes dédiées.
- **Bibliothèque visuelle** : palettes de couleurs personnalisables, bibliothèque d'icônes
  vectorielles professionnelles classées par catégorie (business, finance, équipe, tech,
  statuts...), styles de cadres.
- **Graphiques intégrés** : barres, courbes, camemberts, anneaux — générés automatiquement quand
  le contenu source contient des données chiffrées, éditables ensuite.
- **Éditeur de slides** : réorganiser, dupliquer, supprimer, changer de layout, éditer le texte,
  notes orateur.
- **Export PPTX natif** : génère un vrai fichier `.pptx` (via `pptxgenjs`), avec graphiques
  natifs PowerPoint, prêt à être édité ou présenté.
- **Diagrammes UML/BPMN** : slides de type diagramme générées à partir de code
  [Mermaid](https://mermaid.js.org/) (flowchart, séquence, classes), par l'IA ou manuellement.
- **Import d'image / logo** : remplacez l'icône d'une slide par une image ou un logo uploadé
  localement (aucun backend requis, l'image est encodée directement dans la présentation).
- **Mode présentation** : lancez un vrai plein écran pour présenter le diaporama, avec
  navigation clavier (← → / Espace), notes orateur affichables (`N`), fermeture avec `Échap`,
  transitions animées entre les slides et arrivée des puces en cascade.
- **Chargement animé** : pendant la génération IA, un aperçu animé (skeleton) et des messages
  de progression remplacent l'attente silencieuse.
- **Polices cohérentes** : chaque thème charge sa vraie typographie (Space Grotesk, Playfair
  Display, Sora, Poppins) dans l'aperçu ; l'export `.pptx` utilise des polices équivalentes
  garanties disponibles sous Windows/Mac (Calibri, Georgia, Trebuchet MS...) pour un rendu
  fidèle même sans les polices Google installées.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseignez une clé API (voir ci-dessous)
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### Moteur IA : Gemini (gratuit) ou Claude (payant)

L'app fonctionne avec l'un ou l'autre, au choix via `.env.local` :

- **Google Gemini** (recommandé pour tester gratuitement) : créez une clé sans carte bancaire sur
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey), puis renseignez `GEMINI_API_KEY`.
- **Anthropic Claude** : créez une clé sur [console.anthropic.com](https://console.anthropic.com/),
  puis renseignez `ANTHROPIC_API_KEY`.

Si `GEMINI_API_KEY` est présente, Gemini est utilisé automatiquement. Pour forcer un fournisseur,
définissez `AI_PROVIDER=gemini` ou `AI_PROVIDER=anthropic`.

### Mode présentation

Depuis l'éditeur, cliquez sur **Présenter** pour lancer le diaporama en plein écran.

| Touche | Action |
| --- | --- |
| `→` / `Espace` | Slide suivante |
| `←` | Slide précédente |
| `N` | Afficher / masquer les notes orateur |
| `Échap` | Quitter |

## Stack technique

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** pour l'UI
- **@anthropic-ai/sdk** / **@google/generative-ai** pour la génération de contenu (structured output
  via tool-use / function calling)
- **pptxgenjs** pour la génération du fichier `.pptx` (texte, formes, graphiques natifs)
- **mermaid** pour le rendu des diagrammes UML/BPMN (aperçu + rasterisation pour l'export)
- **lucide-react** pour les icônes d'interface

## Structure du projet

```
src/
  app/
    api/generate/route.ts   # Endpoint qui délègue au fournisseur IA configuré
    page.tsx                # Orchestration des étapes (saisie -> édition)
  components/                # UI (saisie, éditeur, aperçu de slide, sélecteurs)
    PresenterMode.tsx         # Mode présentation plein écran
    DiagramPreview.tsx        # Rendu d'un diagramme Mermaid dans l'aperçu
    GeneratingOverlay.tsx     # État de chargement animé pendant la génération
  lib/
    ai-provider.ts           # Sélectionne Claude ou Gemini selon la config
    anthropic.ts             # Appel Claude avec schéma structuré
    gemini.ts                # Appel Gemini avec schéma structuré
    presentation-prompt.ts   # Prompt partagé entre les deux fournisseurs
    pptx-export.ts           # Génération du fichier .pptx
    diagram.ts               # Rendu Mermaid (UML/BPMN) partagé aperçu + export
    svg-raster.ts            # Rasterisation SVG -> PNG pour l'export PPTX
    fonts.ts                 # Polices Google Fonts chargées + résolution par thème
    themes.ts, palettes.ts, icons.ts, frames.ts   # Bibliothèque de design
  types/slide.ts              # Modèle de données (Slide, Theme, Chart...)
```

## Feuille de route

- [x] Génération de diagrammes UML/BPMN à partir de texte (Mermaid)
- [x] Import d'images / logos
- [ ] Banque d'images intégrée
- [ ] Édition inline directement sur l'aperçu (drag & drop, redimensionnement)
- [ ] Comptes utilisateurs et bibliothèque de présentations sauvegardées
- [ ] Export PDF et partage par lien
