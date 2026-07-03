import type { Slide } from "@/types/slide";

/**
 * The AI occasionally picks a layout without filling the content it needs
 * (e.g. a "quote" slide with an empty body, rendered as a bare “”). Rather
 * than ship a visibly broken slide, drop anything that would render empty
 * for its layout. Falls back to the original list if that would wipe out
 * the whole deck.
 */
export function sanitizeSlides(slides: Slide[]): Slide[] {
  const cleaned = slides.filter((s) => {
    switch (s.layout) {
      case "quote":
        return Boolean(s.body?.trim());
      case "chart":
        return Boolean(s.chart?.series?.length && s.chart.categories?.length);
      case "title-bullets":
        return Boolean(s.bullets?.length);
      case "two-column":
        return Boolean(s.leftBullets?.length || s.rightBullets?.length);
      case "image-text":
        return Boolean(s.body?.trim());
      default:
        return true;
    }
  });
  return cleaned.length > 0 ? cleaned : slides;
}
