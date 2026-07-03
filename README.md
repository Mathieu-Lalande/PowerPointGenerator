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
- **Nouveaux layouts** : slide "Sommaire" (agenda numéroté), "Chiffre clé" (stat géante),
  "Comparaison A vs B" (deux colonnes + badge VS) et "Équipe" (fiches nom/rôle) — disponibles
  à la génération IA comme dans l'éditeur, et exportés nativement en `.pptx`.
- **Édition inline sur l'aperçu** : cliquez directement sur un texte dans l'aperçu principal
  pour le modifier sur place (titre, puces, légendes...), sans passer par le panneau de droite.
- **Glisser-déposer** : réorganisez les slides dans la liste de gauche en les faisant glisser
  (les flèches ↑/↓ restent disponibles).
- **Annuler / rétablir** : `Ctrl+Z` / `Ctrl+Y` (ou les boutons dédiés) annulent et rétablissent
  les modifications de contenu, mise en page et réorganisation.
- **Régénération IA par slide** : bouton "Régénérer cette slide avec l'IA" dans le panneau de
  droite pour reformuler uniquement la slide sélectionnée, sans relancer toute la génération.
- **Sauvegarde automatique locale** : la présentation en cours est sauvegardée dans le
  `localStorage` du navigateur au fil de l'édition ; un historique de brouillons permet de
  reprendre une présentation après un rechargement de page, sans backend ni compte.
- **Export PDF côté client** : export `.pdf` directement depuis le navigateur (via rendu DOM +
  capture), sans aucun aller-retour serveur.

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
- **html2canvas** / **jsPDF** pour l'export PDF côté client (aucun backend)
- **mermaid** pour le rendu des diagrammes UML/BPMN (aperçu + rasterisation pour l'export)
- **lucide-react** pour les icônes d'interface
- **localStorage** pour la sauvegarde automatique et l'historique de brouillons (aucun backend)

## Structure du projet

```
src/
  app/
    api/generate/route.ts            # Endpoint qui délègue au fournisseur IA configuré
    api/regenerate-slide/route.ts    # Endpoint qui reformule une seule slide
    page.tsx                         # Orchestration des étapes (saisie -> édition)
  components/                # UI (saisie, éditeur, aperçu de slide, sélecteurs)
    PresenterMode.tsx         # Mode présentation plein écran
    DiagramPreview.tsx        # Rendu d'un diagramme Mermaid dans l'aperçu
    GeneratingOverlay.tsx     # État de chargement animé pendant la génération
    SlideList.tsx             # Liste des slides, réorganisables par glisser-déposer
    Inspector.tsx             # Panneau d'édition du contenu de la slide sélectionnée
  lib/
    ai-provider.ts           # Sélectionne Claude ou Gemini selon la config
    anthropic.ts             # Appel Claude avec schéma structuré
    gemini.ts                # Appel Gemini avec schéma structuré
    presentation-prompt.ts   # Prompt partagé entre les deux fournisseurs
    pptx-export.ts           # Génération du fichier .pptx
    pdf-export.ts            # Export PDF côté client (html2canvas + jsPDF)
    drafts.ts                # Sauvegarde automatique + historique de brouillons (localStorage)
    use-undo-redo.ts         # Hook d'historique annuler/rétablir avec regroupement des saisies
    diagram.ts               # Rendu Mermaid (UML/BPMN) partagé aperçu + export
    svg-raster.ts            # Rasterisation SVG -> PNG pour l'export PPTX
    fonts.ts                 # Polices Google Fonts chargées + résolution par thème
    themes.ts, palettes.ts, icons.ts, frames.ts   # Bibliothèque de design
  types/slide.ts              # Modèle de données (Slide, Theme, Chart...)
```

## Feuille de route

- [x] Génération de diagrammes UML/BPMN à partir de texte (Mermaid)
- [x] Import d'images / logos
- [x] Édition inline directement sur l'aperçu (texte cliquable, sur place)
- [x] Sauvegarde automatique locale + historique de brouillons
- [x] Glisser-déposer pour réorganiser les slides
- [x] Annuler / rétablir dans l'éditeur
- [x] Régénération d'une slide isolée par l'IA
- [x] Export PDF côté client
- [ ] Redimensionnement libre des blocs de texte sur l'aperçu (positionnement freeform)
- [ ] Banque d'images intégrée
- [ ] Comptes utilisateurs et bibliothèque de présentations sauvegardées
- [ ] Partage de présentation par lien
