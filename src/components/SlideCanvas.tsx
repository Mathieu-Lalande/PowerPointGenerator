"use client";

import type { Slide, Theme } from "@/types/slide";
import { getFrame } from "@/lib/frames";
import { getIconComponent, DEFAULT_ILLUSTRATION_ICON } from "@/lib/icons";
import MiniChart from "@/components/MiniChart";
import clsx from "clsx";

interface Props {
  slide: Slide;
  theme: Theme;
  accent: string;
}

export default function SlideCanvas({ slide, theme, accent }: Props) {
  const c = theme.colors;
  const frame = getFrame(slide.frame);
  const headingStyle = { fontFamily: theme.headingFont, color: c.text };
  const bodyStyle = { fontFamily: theme.bodyFont, color: c.text };
  const SlideIcon = getIconComponent(slide.icon);
  const IllustrationIcon = getIconComponent(slide.icon) ?? getIconComponent(DEFAULT_ILLUSTRATION_ICON)!;

  const base = (
    <div
      className={clsx("relative flex h-full w-full flex-col overflow-hidden p-8", frame.previewClass)}
      style={{ backgroundColor: c.background, color: c.text }}
    >
      {renderContent()}
    </div>
  );

  function renderContent() {
    switch (slide.layout) {
      case "title":
        return (
          <div
            className="flex h-full w-full flex-col justify-center gap-4 rounded-xl p-8"
            style={{ backgroundColor: c.primary }}
          >
            {SlideIcon && <SlideIcon size={44} strokeWidth={1.6} color={c.background} />}
            <h1 className="text-4xl font-bold" style={{ fontFamily: theme.headingFont, color: c.background }}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="text-lg" style={{ fontFamily: theme.bodyFont, color: c.background, opacity: 0.85 }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        );
      case "section":
        return (
          <div
            className="flex h-full w-full flex-col justify-center gap-3 rounded-xl p-8"
            style={{ backgroundColor: accent }}
          >
            <span className="h-1 w-16 rounded" style={{ backgroundColor: c.primary }} />
            <h2 className="text-3xl font-bold" style={headingStyle}>
              {slide.title}
            </h2>
          </div>
        );
      case "title-bullets":
        return (
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-3">
              {SlideIcon && <SlideIcon size={26} strokeWidth={1.75} color={accent} />}
              <h2 className="text-2xl font-bold" style={headingStyle}>
                {slide.title}
              </h2>
            </div>
            <ul className="space-y-2 pl-1" style={bodyStyle}>
              {slide.bullets?.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span style={{ color: accent }}>●</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case "two-column":
        return (
          <div className="flex h-full flex-col gap-4">
            <h2 className="text-xl font-bold" style={headingStyle}>
              {slide.title}
            </h2>
            <div className="grid flex-1 grid-cols-2 gap-6">
              <ul className="space-y-2 border-r pr-4" style={{ ...bodyStyle, borderColor: c.textMuted + "40" }}>
                {slide.leftBullets?.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span style={{ color: accent }}>●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2" style={bodyStyle}>
                {slide.rightBullets?.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span style={{ color: accent }}>●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-md text-2xl italic" style={headingStyle}>
              &ldquo;{slide.body}&rdquo;
            </p>
            {slide.quoteAuthor && (
              <p className="text-sm" style={{ color: c.textMuted }}>
                — {slide.quoteAuthor}
              </p>
            )}
          </div>
        );
      case "chart":
        return (
          <div className="flex h-full flex-col gap-3">
            <h2 className="text-xl font-bold" style={headingStyle}>
              {slide.title}
            </h2>
            <div className="flex flex-1 items-center justify-center">
              {slide.chart && (
                <MiniChart
                  chart={slide.chart}
                  colors={[accent, c.primary, c.secondary, c.textMuted]}
                  textColor={c.text}
                />
              )}
            </div>
          </div>
        );
      case "image-text":
        return (
          <div className="flex h-full items-center gap-6">
            <div
              className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: c.surface }}
            >
              <IllustrationIcon size={52} strokeWidth={1.5} color={accent} />
            </div>
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-bold" style={headingStyle}>
                {slide.title}
              </h2>
              <p className="text-sm" style={bodyStyle}>
                {slide.body}
              </p>
            </div>
          </div>
        );
      case "closing":
        return (
          <div
            className="flex h-full flex-col justify-center gap-4 rounded-xl p-8"
            style={{ backgroundColor: c.primary }}
          >
            <h2 className="text-3xl font-bold" style={{ fontFamily: theme.headingFont, color: c.background }}>
              {slide.title || "Merci"}
            </h2>
            <ul className="space-y-1.5">
              {slide.bullets?.map((b, i) => (
                <li key={i} className="text-sm" style={{ color: c.background, opacity: 0.9 }}>
                  → {b}
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  }

  return base;
}
