# SlideCraft AI

Plateforme web pour créer des présentations PowerPoint professionnelles à partir d'idées, de notes,
de comptes-rendus ou de texte libre. L'IA (Claude) structure et rédige les slides selon un thème
choisi ; l'éditeur intégré permet d'ajuster le contenu, les icônes/emojis, les cadres et les couleurs
avant d'exporter un vrai fichier `.pptx` éditable dans PowerPoint.

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

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseignez ANTHROPIC_API_KEY
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

Une clé API Anthropic est nécessaire pour la génération IA : créez-en une sur
[console.anthropic.com](https://console.anthropic.com/) et placez-la dans `.env.local`.

## Stack technique

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** pour l'UI
- **@anthropic-ai/sdk** pour la génération de contenu (structured output via tool-use)
- **pptxgenjs** pour la génération du fichier `.pptx` (texte, formes, graphiques natifs)
- **lucide-react** pour les icônes d'interface

## Structure du projet

```
src/
  app/
    api/generate/route.ts   # Endpoint qui appelle Claude pour générer le plan de slides
    page.tsx                # Orchestration des étapes (saisie -> édition)
  components/                # UI (saisie, éditeur, aperçu de slide, sélecteurs)
  lib/
    anthropic.ts             # Appel Claude avec schéma structuré
    pptx-export.ts           # Génération du fichier .pptx
    themes.ts, palettes.ts, emojis.ts, frames.ts   # Bibliothèque de design
  types/slide.ts              # Modèle de données (Slide, Theme, Chart...)
```

## Feuille de route (prochaines itérations)

- Génération de diagrammes UML/BPMN à partir de texte
- Import d'images / logos, banque d'images
- Édition inline directement sur l'aperçu (drag & drop, redimensionnement)
- Comptes utilisateurs et bibliothèque de présentations sauvegardées
- Export PDF et partage par lien
