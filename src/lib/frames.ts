export interface FrameStyle {
  id: string;
  name: string;
  /** Tailwind classes used for on-screen preview */
  previewClass: string;
  /** Border spec used when drawing the equivalent shape in the exported PPTX */
  pptx: {
    lineWidth: number;
    lineDash: "solid" | "dash" | "lgDash";
    rectRadius: number;
  };
}

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: "none",
    name: "Aucun",
    previewClass: "",
    pptx: { lineWidth: 0, lineDash: "solid", rectRadius: 0 },
  },
  {
    id: "thin",
    name: "Trait fin",
    previewClass: "border border-current/40",
    pptx: { lineWidth: 0.75, lineDash: "solid", rectRadius: 0 },
  },
  {
    id: "bold",
    name: "Trait épais",
    previewClass: "border-4 border-current",
    pptx: { lineWidth: 3, lineDash: "solid", rectRadius: 0 },
  },
  {
    id: "rounded",
    name: "Arrondi",
    previewClass: "border-2 border-current rounded-2xl",
    pptx: { lineWidth: 1.5, lineDash: "solid", rectRadius: 12 },
  },
  {
    id: "dashed",
    name: "Pointillés",
    previewClass: "border-2 border-dashed border-current",
    pptx: { lineWidth: 1.5, lineDash: "dash", rectRadius: 0 },
  },
];

export function getFrame(id: string | undefined): FrameStyle {
  return FRAME_STYLES.find((f) => f.id === id) ?? FRAME_STYLES[0];
}
