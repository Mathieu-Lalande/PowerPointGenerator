import type { Presentation, Slide, Theme } from "@/types/slide";
import { getFrame } from "@/lib/frames";
import { iconToPngDataUrl } from "@/lib/icon-raster";
import { DEFAULT_ILLUSTRATION_ICON } from "@/lib/icons";
import { renderMermaidToSvg } from "@/lib/diagram";
import { svgToRasterInfo, fitContain } from "@/lib/svg-raster";

const hex = (c: string) => c.replace("#", "");

const PPTX_W = 10;
const PPTX_H = 5.63;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Resolves a text block's pptx position/size: uses the user's freeform
 * override (percentages of the slide canvas, set via drag/resize in the web
 * editor) when present, otherwise falls back to the hand-tuned default that
 * approximates the web preview's flow layout.
 */
function box(slide: Slide, slotKey: string, fallback: Box): Box {
  const o = slide.textOverrides?.[slotKey];
  if (!o) return fallback;
  return {
    x: (o.x / 100) * PPTX_W,
    y: (o.y / 100) * PPTX_H,
    w: (o.w / 100) * PPTX_W,
    h: (o.h / 100) * PPTX_H,
  };
}

// The web preview uses real Google Fonts (Space Grotesk, Sora, Playfair
// Display...), but pptxgenjs can't embed fonts in the .pptx file — PowerPoint
// falls back to whatever's installed on the viewer's machine, which is
// essentially never one of those. Substitute the closest font that ships
// with Windows/Mac Office so the exported deck looks intentional instead of
// randomly substituted.
const PPTX_SAFE_FONT: Record<string, string> = {
  Poppins: "Calibri",
  "Space Grotesk": "Trebuchet MS",
  Sora: "Century Gothic",
  "Playfair Display": "Georgia",
  Inter: "Calibri",
};

function pptxFont(name: string): string {
  return PPTX_SAFE_FONT[name] ?? name;
}

function chartTypeFor(pptx: any, type: string) {
  switch (type) {
    case "line":
      return pptx.ChartType.line;
    case "pie":
      return pptx.ChartType.pie;
    case "donut":
      return pptx.ChartType.doughnut;
    default:
      return pptx.ChartType.bar;
  }
}

function addBackground(slide: any, theme: Theme) {
  slide.background = { color: hex(theme.colors.background) };
}

async function addFooterIcon(
  slide: any,
  icon: string | undefined,
  color: string,
  pos: { x?: number; y?: number; size?: number } = {}
) {
  if (!icon) return;
  const size = pos.size ?? 0.55;
  const x = pos.x ?? 0.5;
  const y = pos.y ?? 0.45;
  const dataUrl = await iconToPngDataUrl(icon, color, 128);
  if (!dataUrl) return;
  slide.addImage({ data: dataUrl, x, y, w: size, h: size });
}

function addFrame(slide: any, framId: string | undefined, theme: Theme, accent: string) {
  const frame = getFrame(framId);
  if (frame.pptx.lineWidth === 0) return;
  slide.addShape("roundRect", {
    x: 0.3,
    y: 0.3,
    w: 9.4,
    h: 5.0,
    rectRadius: frame.pptx.rectRadius / 72,
    fill: { type: "none" },
    line: {
      color: hex(accent),
      width: frame.pptx.lineWidth,
      dashType: frame.pptx.lineDash,
    },
  });
}

async function buildSlide(pptx: any, slide: Slide, theme: Theme, accent: string, logoDataUrl?: string) {
  const s = pptx.addSlide();
  addBackground(s, theme);
  const textColor = hex(theme.colors.text);
  const mutedColor = hex(theme.colors.textMuted);
  const primary = hex(theme.colors.primary);
  const accentHex = hex(accent);
  const headingFont = pptxFont(theme.headingFont);
  const bodyFont = pptxFont(theme.bodyFont);

  addFrame(s, slide.frame, theme, accent);

  if (logoDataUrl) {
    s.addImage({
      data: logoDataUrl,
      x: PPTX_W - 1.3,
      y: PPTX_H - 0.55,
      w: 1.1,
      h: 0.4,
      sizing: { type: "contain", w: 1.1, h: 0.4 },
    });
  }

  switch (slide.layout) {
    case "title": {
      s.background = { color: primary };
      await addFooterIcon(s, slide.icon, theme.colors.background);
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 2.0, w: 8.8, h: 1.4 }),
        fontSize: 40,
        bold: true,
        color: hex(theme.colors.background),
        fontFace: headingFont,
        align: "left",
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          ...box(slide, "subtitle", { x: 0.6, y: 3.3, w: 8.8, h: 1 }),
          fontSize: 18,
          color: hex(theme.colors.background),
          fontFace: bodyFont,
          align: "left",
        });
      }
      break;
    }
    case "section": {
      s.background = { color: accentHex };
      s.addShape("rect", { x: 0, y: 2.55, w: 1.6, h: 0.08, fill: { color: primary } });
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 2.0, w: 8.8, h: 1.2 }),
        fontSize: 34,
        bold: true,
        color: hex(theme.colors.text),
        fontFace: headingFont,
      });
      break;
    }
    case "title-bullets": {
      const hasIcon = Boolean(slide.icon);
      // Center the icon on the title box's vertical middle (y:0.55, h:0.7) to
      // match the flexbox row alignment used in the web preview.
      if (hasIcon) await addFooterIcon(s, slide.icon, accent, { x: 0.6, y: 0.625 });
      s.addText(slide.title || "", {
        ...box(slide, "header", { x: hasIcon ? 1.3 : 0.6, y: 0.55, w: hasIcon ? 8.1 : 8.8, h: 0.7 }),
        fontSize: 20,
        bold: true,
        color: textColor,
        fontFace: headingFont,
        valign: "middle",
      });
      s.addShape("rect", { x: 0.65, y: 1.3, w: 0.55, h: 0.06, fill: { color: accentHex } });
      if (slide.bullets?.length) {
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            ...box(slide, "bullets", { x: 0.7, y: 1.75, w: 8.6, h: 3.4 }),
            fontSize: 18,
            paraSpaceAfter: 14,
            color: textColor,
            fontFace: bodyFont,
            valign: "middle",
          }
        );
      }
      break;
    }
    case "two-column": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.5, w: 8.8, h: 0.7 }),
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: headingFont,
      });
      s.addShape("rect", { x: 0.62, y: 1.2, w: 0.55, h: 0.06, fill: { color: accentHex } });
      if (slide.leftBullets?.length) {
        s.addText(
          slide.leftBullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            ...box(slide, "leftBullets", { x: 0.6, y: 1.7, w: 4.2, h: 3.4 }),
            fontSize: 16,
            paraSpaceAfter: 10,
            color: textColor,
            fontFace: bodyFont,
            valign: "middle",
          }
        );
      }
      if (slide.rightBullets?.length) {
        s.addText(
          slide.rightBullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            ...box(slide, "rightBullets", { x: 5.2, y: 1.7, w: 4.2, h: 3.4 }),
            fontSize: 16,
            paraSpaceAfter: 10,
            color: textColor,
            fontFace: bodyFont,
            valign: "middle",
          }
        );
      }
      s.addShape("line", {
        x: 5.0,
        y: 1.7,
        w: 0,
        h: 3.4,
        line: { color: mutedColor, width: 0.75 },
      });
      break;
    }
    case "quote": {
      s.addText(`“${slide.body || ""}”`, {
        ...box(slide, "body", { x: 1, y: 1.8, w: 8, h: 2 }),
        fontSize: 26,
        italic: true,
        color: textColor,
        fontFace: headingFont,
        align: "center",
      });
      if (slide.quoteAuthor) {
        s.addText(`— ${slide.quoteAuthor}`, {
          ...box(slide, "quoteAuthor", { x: 1, y: 3.9, w: 8, h: 0.5 }),
          fontSize: 16,
          color: mutedColor,
          fontFace: bodyFont,
          align: "center",
        });
      }
      break;
    }
    case "chart": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.4, w: 8.8, h: 0.7 }),
        fontSize: 22,
        bold: true,
        color: textColor,
        fontFace: headingFont,
      });
      if (slide.chart) {
        const palette = [accentHex, primary, hex(theme.colors.secondary), mutedColor];
        const data = slide.chart.series.map((series, idx) => ({
          name: series.name,
          labels: slide.chart!.categories,
          values: series.values,
        }));
        s.addChart(chartTypeFor(pptx, slide.chart.type), data, {
          x: 0.7,
          y: 1.3,
          w: 8.6,
          h: 3.9,
          chartColors: palette,
          showLegend: slide.chart.series.length > 1,
          legendPos: "b",
          catAxisLabelColor: mutedColor,
          valAxisLabelColor: mutedColor,
        });
      }
      break;
    }
    case "image-text": {
      s.addShape("roundRect", {
        x: 0.6,
        y: 1.6,
        w: 3,
        h: 3,
        rectRadius: 0.15,
        fill: { color: hex(theme.colors.surface) },
        line: { type: "none" },
      });
      if (slide.imageDataUrl) {
        s.addImage({
          data: slide.imageDataUrl,
          x: 0.6,
          y: 1.6,
          w: 3,
          h: 3,
          sizing: { type: "cover", w: 3, h: 3 },
        });
      } else {
        const illustrationDataUrl = await iconToPngDataUrl(
          slide.icon || DEFAULT_ILLUSTRATION_ICON,
          accent,
          256
        );
        if (illustrationDataUrl) {
          s.addImage({ data: illustrationDataUrl, x: 1.55, y: 2.55, w: 1.1, h: 1.1 });
        }
      }
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 4.0, y: 1.5, w: 5.4, h: 0.8 }),
        fontSize: 22,
        bold: true,
        color: textColor,
        fontFace: headingFont,
      });
      s.addShape("rect", { x: 4.02, y: 2.25, w: 0.55, h: 0.06, fill: { color: accentHex } });
      s.addText(slide.body || "", {
        ...box(slide, "body", { x: 4.0, y: 2.5, w: 5.4, h: 2.6 }),
        fontSize: 16,
        color: textColor,
        fontFace: bodyFont,
      });
      break;
    }
    case "diagram": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.4, w: 8.8, h: 0.7 }),
        fontSize: 22,
        bold: true,
        color: textColor,
        fontFace: headingFont,
      });
      if (slide.diagramCode?.trim()) {
        try {
          const svg = await renderMermaidToSvg(slide.diagramCode);
          const raster = await svgToRasterInfo(svg, 1400);
          if (raster) {
            const boxX = 0.6;
            const boxY = 1.3;
            const boxW = 8.8;
            const boxH = 3.9;
            const pad = 0.3;
            s.addShape("roundRect", {
              x: boxX,
              y: boxY,
              w: boxW,
              h: boxH,
              rectRadius: 0.08,
              fill: { color: "FFFFFF" },
              line: { type: "none" },
            });
            const { w, h } = fitContain(boxW - pad * 2, boxH - pad * 2, raster.aspect);
            s.addImage({
              data: raster.dataUrl,
              x: boxX + (boxW - w) / 2,
              y: boxY + (boxH - h) / 2,
              w,
              h,
            });
          }
        } catch {
          // Invalid Mermaid syntax: leave the slide without a diagram rather than failing the export.
        }
      }
      break;
    }
    case "agenda": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.5, w: 8.8, h: 0.7 }),
        fontSize: 26,
        bold: true,
        color: textColor,
        fontFace: headingFont,
      });
      s.addShape("rect", { x: 0.62, y: 1.25, w: 0.55, h: 0.06, fill: { color: accentHex } });
      const items = slide.bullets ?? [];
      const listBox = box(slide, "bullets", { x: 0.6, y: 1.6, w: 8.8, h: 3.6 });
      const rowH = Math.min(0.85, listBox.h / Math.max(items.length, 1));
      items.forEach((item, i) => {
        const y = listBox.y + i * rowH;
        s.addText(String(i + 1).padStart(2, "0"), {
          x: listBox.x,
          y,
          w: 0.9,
          h: rowH,
          fontSize: 22,
          bold: true,
          color: accentHex,
          fontFace: headingFont,
          valign: "middle",
        });
        s.addText(item, {
          x: listBox.x + 1.0,
          y,
          w: listBox.w - 1.0,
          h: rowH,
          fontSize: 17,
          color: textColor,
          fontFace: bodyFont,
          valign: "middle",
        });
        if (i < items.length - 1) {
          s.addShape("line", {
            x: listBox.x,
            y: y + rowH,
            w: listBox.w,
            h: 0,
            line: { color: mutedColor, width: 0.5, dashType: "dash" },
          });
        }
      });
      break;
    }
    case "stat": {
      s.background = { color: primary };
      if (slide.title) {
        s.addText(slide.title, {
          ...box(slide, "title", { x: 0.6, y: 0.5, w: 8.8, h: 0.6 }),
          fontSize: 16,
          color: hex(theme.colors.background),
          fontFace: bodyFont,
          align: "center",
        });
      }
      s.addText(slide.statValue || "", {
        ...box(slide, "statValue", { x: 0.6, y: 1.6, w: 8.8, h: 2.0 }),
        fontSize: 96,
        bold: true,
        color: hex(theme.colors.background),
        fontFace: headingFont,
        align: "center",
      });
      if (slide.statLabel) {
        s.addText(slide.statLabel, {
          ...box(slide, "statLabel", { x: 0.6, y: 3.6, w: 8.8, h: 0.8 }),
          fontSize: 22,
          color: hex(theme.colors.background),
          fontFace: bodyFont,
          align: "center",
        });
      }
      break;
    }
    case "comparison": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.4, w: 8.8, h: 0.7 }),
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: headingFont,
        align: "center",
      });
      s.addShape("roundRect", {
        x: 0.5,
        y: 1.3,
        w: 4.1,
        h: 3.8,
        rectRadius: 0.1,
        fill: { color: hex(theme.colors.surface) },
        line: { type: "none" },
      });
      const leftBox = box(slide, "leftColumn", { x: 0.7, y: 1.5, w: 3.7, h: 3.45 });
      const leftTitleH = Math.min(0.5, leftBox.h * 0.2);
      s.addText(slide.leftTitle || "", {
        x: leftBox.x,
        y: leftBox.y,
        w: leftBox.w,
        h: leftTitleH,
        fontSize: 18,
        bold: true,
        color: accentHex,
        fontFace: headingFont,
      });
      if (slide.leftBullets?.length) {
        s.addText(
          slide.leftBullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            x: leftBox.x,
            y: leftBox.y + leftTitleH + 0.1,
            w: leftBox.w,
            h: leftBox.h - leftTitleH - 0.1,
            fontSize: 14,
            paraSpaceAfter: 8,
            color: textColor,
            fontFace: bodyFont,
          }
        );
      }
      s.addShape("roundRect", {
        x: 5.4,
        y: 1.3,
        w: 4.1,
        h: 3.8,
        rectRadius: 0.1,
        fill: { color: hex(theme.colors.surface) },
        line: { type: "none" },
      });
      const rightBox = box(slide, "rightColumn", { x: 5.6, y: 1.5, w: 3.7, h: 3.45 });
      const rightTitleH = Math.min(0.5, rightBox.h * 0.2);
      s.addText(slide.rightTitle || "", {
        x: rightBox.x,
        y: rightBox.y,
        w: rightBox.w,
        h: rightTitleH,
        fontSize: 18,
        bold: true,
        color: accentHex,
        fontFace: headingFont,
      });
      if (slide.rightBullets?.length) {
        s.addText(
          slide.rightBullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            x: rightBox.x,
            y: rightBox.y + rightTitleH + 0.1,
            w: rightBox.w,
            h: rightBox.h - rightTitleH - 0.1,
            fontSize: 14,
            paraSpaceAfter: 8,
            color: textColor,
            fontFace: bodyFont,
          }
        );
      }
      s.addShape("ellipse", {
        x: 4.55,
        y: 2.95,
        w: 0.9,
        h: 0.9,
        fill: { color: accentHex },
        line: { type: "none" },
      });
      s.addText("VS", {
        x: 4.55,
        y: 2.95,
        w: 0.9,
        h: 0.9,
        fontSize: 16,
        bold: true,
        color: hex(theme.colors.background),
        align: "center",
        valign: "middle",
        fontFace: headingFont,
      });
      break;
    }
    case "team": {
      s.addText(slide.title || "", {
        ...box(slide, "title", { x: 0.6, y: 0.4, w: 8.8, h: 0.7 }),
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: headingFont,
        align: "center",
      });
      const members = slide.teamMembers ?? [];
      const cols = Math.min(members.length, 4) || 1;
      const rows = Math.max(1, Math.ceil(members.length / cols));
      const gap = 0.3;
      const defaultCardW = (9.4 - gap * (cols - 1)) / cols;
      const defaultStartX = (10 - (defaultCardW * cols + gap * (cols - 1))) / 2;
      const gridBox = box(slide, "teamGrid", {
        x: defaultStartX,
        y: 1.6,
        w: defaultCardW * cols + gap * (cols - 1),
        h: rows * 2.2,
      });
      const cardW = (gridBox.w - gap * (cols - 1)) / cols;
      const rowH = gridBox.h / rows;
      members.forEach((member, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridBox.x + col * (cardW + gap);
        const cy = gridBox.y + row * rowH;
        s.addShape("ellipse", {
          x: x + cardW / 2 - 0.5,
          y: cy,
          w: 1,
          h: 1,
          fill: { color: hex(theme.colors.surface) },
          line: { color: accentHex, width: 1.5 },
        });
        const initials = (member.name || "?")
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        s.addText(initials, {
          x: x + cardW / 2 - 0.5,
          y: cy,
          w: 1,
          h: 1,
          fontSize: 20,
          bold: true,
          color: accentHex,
          align: "center",
          valign: "middle",
          fontFace: headingFont,
        });
        s.addText(member.name || "", {
          x,
          y: cy + 1.1,
          w: cardW,
          h: 0.4,
          fontSize: 15,
          bold: true,
          color: textColor,
          align: "center",
          fontFace: headingFont,
        });
        s.addText(member.role || "", {
          x,
          y: cy + 1.5,
          w: cardW,
          h: 0.4,
          fontSize: 12,
          color: mutedColor,
          align: "center",
          fontFace: bodyFont,
        });
      });
      break;
    }
    case "closing": {
      s.background = { color: primary };
      s.addText(slide.title || "Merci", {
        ...box(slide, "title", { x: 0.6, y: 1.6, w: 8.8, h: 1 }),
        fontSize: 34,
        bold: true,
        color: hex(theme.colors.background),
        fontFace: headingFont,
      });
      if (slide.bullets?.length) {
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
          {
            ...box(slide, "bullets", { x: 0.7, y: 2.7, w: 8.4, h: 2.4 }),
            fontSize: 18,
            paraSpaceAfter: 10,
            color: hex(theme.colors.background),
            fontFace: bodyFont,
          }
        );
      }
      break;
    }
  }

  if (slide.notes) {
    s.addNotes(slide.notes);
  }
}

export async function exportPresentationToPptx(
  presentation: Presentation,
  theme: Theme
) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: PPTX_W, height: PPTX_H });
  pptx.layout = "WIDE";

  const accent = presentation.paletteOverride?.[0] || theme.colors.accent;
  const logoDataUrl = presentation.brandKit?.logoDataUrl;

  for (const slide of presentation.slides) {
    await buildSlide(pptx, slide, theme, accent, logoDataUrl);
  }

  const filename = `${presentation.title || "presentation"}.pptx`.replace(/[\\/:*?"<>|]/g, "");
  await pptx.writeFile({ fileName: filename });
}
