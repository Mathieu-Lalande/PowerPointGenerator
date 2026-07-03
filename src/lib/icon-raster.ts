import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getIconComponent } from "@/lib/icons";

const cache = new Map<string, string | null>();

export async function iconToPngDataUrl(
  iconId: string | undefined,
  color: string,
  pixelSize = 128
): Promise<string | null> {
  if (!iconId) return null;
  const key = `${iconId}:${color}:${pixelSize}`;
  if (cache.has(key)) return cache.get(key)!;

  const Icon = getIconComponent(iconId);
  if (!Icon) return null;

  const svgMarkup = renderToStaticMarkup(
    createElement(Icon, { color, size: pixelSize, strokeWidth: 1.6 })
  );
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

  const result = await new Promise<string | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelSize;
      canvas.height = pixelSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = svgDataUrl;
  });

  cache.set(key, result);
  return result;
}
