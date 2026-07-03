import type { Presentation, Theme } from "@/types/slide";

function waitForImages(root: HTMLElement, timeoutMs = 2000): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          })
      )
    ).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Renders every slide off-screen at high resolution and assembles a PDF
 * client-side (no backend round trip) via html2canvas + jsPDF.
 */
export async function exportPresentationToPdf(
  presentation: Presentation,
  theme: Theme,
  accent: string
) {
  const [{ default: html2canvas }, { jsPDF }, ReactDOM, React, { default: ScaledSlide }] =
    await Promise.all([
      import("html2canvas"),
      import("jspdf"),
      import("react-dom/client"),
      import("react"),
      import("@/components/ScaledSlide"),
    ]);

  const nativeWidth = 1280;
  const nativeHeight = Math.round((nativeWidth * 9) / 16);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-99999px";
  container.style.width = `${nativeWidth}px`;
  container.style.height = `${nativeHeight}px`;
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [nativeWidth, nativeHeight] });

  try {
    for (let i = 0; i < presentation.slides.length; i++) {
      const slide = presentation.slides[i];
      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(
            "div",
            { style: { width: nativeWidth, height: nativeHeight } },
            React.createElement(ScaledSlide, {
              slide,
              theme,
              accent,
              nativeWidth,
              logoDataUrl: presentation.brandKit?.logoDataUrl,
            })
          )
        );
        setTimeout(resolve, 60);
      });
      await waitForImages(container);
      // extra settle time for the mermaid SVG data-URL <img> to actually paint
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(container, {
        width: nativeWidth,
        height: nativeHeight,
        scale: 1,
        useCORS: true,
        backgroundColor: theme.colors.background,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage([nativeWidth, nativeHeight], "landscape");
      pdf.addImage(imgData, "JPEG", 0, 0, nativeWidth, nativeHeight);
    }
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }

  const filename = `${presentation.title || "presentation"}.pdf`.replace(/[\\/:*?"<>|]/g, "");
  pdf.save(filename);
}
