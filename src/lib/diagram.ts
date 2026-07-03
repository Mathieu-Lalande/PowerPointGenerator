let mermaidPromise: Promise<any> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
        fontFamily: "Inter, sans-serif",
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

let counter = 0;

export async function renderMermaidToSvg(code: string): Promise<string> {
  const mermaid = await loadMermaid();
  const id = `mermaid-diagram-${Date.now()}-${++counter}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
}

export const DIAGRAM_TEMPLATES: { id: string; label: string; code: string }[] = [
  {
    id: "flowchart",
    label: "Flux (process)",
    code: `flowchart TD
    A[Idée] --> B[Analyse]
    B --> C{Validé ?}
    C -->|Oui| D[Développement]
    C -->|Non| A
    D --> E[Lancement]`,
  },
  {
    id: "sequence",
    label: "Séquence",
    code: `sequenceDiagram
    participant U as Utilisateur
    participant A as Application
    participant S as Serveur
    U->>A: Envoie une demande
    A->>S: Requête API
    S-->>A: Réponse
    A-->>U: Affiche le résultat`,
  },
  {
    id: "class",
    label: "Classes (UML)",
    code: `classDiagram
    class Utilisateur {
      +String nom
      +String email
      +seConnecter()
    }
    class Commande {
      +Date date
      +Number montant
      +valider()
    }
    Utilisateur "1" --> "*" Commande`,
  },
];
