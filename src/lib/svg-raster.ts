export function parseSvgAspectRatio(svg: string): number {
  const match = svg.match(/viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/);
  if (match) {
    const w = parseFloat(match[1]);
    const h = parseFloat(match[2]);
    if (w > 0 && h > 0) return h / w;
  }
  return 0.6;
}

export async function svgToRasterInfo(
  svgMarkup: string,
  targetWidth = 1400
): Promise<{ dataUrl: string; aspect: number } | null> {
  const aspect = parseSvgAspectRatio(svgMarkup);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = Math.max(1, Math.round(targetWidth * aspect));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL("image/png"), aspect });
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  });
}

export function fitContain(maxW: number, maxH: number, aspectHW: number): { w: number; h: number } {
  let w = maxW;
  let h = w * aspectHW;
  if (h > maxH) {
    h = maxH;
    w = h / aspectHW;
  }
  return { w, h };
}
