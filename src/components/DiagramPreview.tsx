"use client";

import { useEffect, useState } from "react";
import { renderMermaidToSvg } from "@/lib/diagram";

interface Props {
  code: string | undefined;
  className?: string;
}

export default function DiagramPreview({ code, className }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(false);

    if (!code?.trim()) return;

    renderMermaidToSvg(code)
      .then((svg) => {
        if (!cancelled) {
          setDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code?.trim()) {
    return <p className="text-sm text-black/40">Ajoutez du code Mermaid dans le panneau de droite.</p>;
  }
  if (error) {
    return <p className="text-sm text-red-500">Diagramme invalide — vérifiez la syntaxe Mermaid.</p>;
  }
  if (!dataUrl) {
    return <p className="text-sm text-black/40">Rendu du diagramme...</p>;
  }
  // An <img> is a proper replaced element, so max-width/max-height + object-fit
  // reliably shrink the diagram to fit — unlike inline <svg>, whose own
  // width/height/style attributes beat any CSS class in the cascade.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="Diagramme" className={className} />;
}
