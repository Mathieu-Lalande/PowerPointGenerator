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
            className="relative flex h-full w-full flex-col justify-center gap-4 overflow-hidden rounded-xl p-8"
            style={{ backgroundColor: c.primary }}
          >
            <span
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10"
              style={{ backgroundColor: c.background }}
            />
            <span
              className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full opacity-[0.08]"
              style={{ backgroundColor: c.background }}
            />
            {SlideIcon && (
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: c.background + "22" }}
              >
                <SlideIcon size={30} strokeWidth={1.6} color={c.background} />
              </span>
            )}
            <h1 className="relative text-4xl font-bold" style={{ fontFamily: theme.headingFont, color: c.background }}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="relative text-lg" style={{ fontFamily: theme.bodyFont, color: c.background, opacity: 0.85 }}>
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
          <div className="flex h-full flex-col">
            <div className="mb-3 flex items-center gap-3">
              {SlideIcon && (
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: accent + "1a" }}
                >
                  <SlideIcon size={22} strokeWidth={1.75} color={accent} />
                </span>
              )}
              <h2 className="text-2xl font-bold leading-tight" style={headingStyle}>
                {slide.title}
              </h2>
            </div>
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <ul className="flex flex-1 flex-col justify-center space-y-5" style={bodyStyle}>
              {slide.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base leading-snug">
                  <span
                    className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case "two-column":
        return (
          <div className="flex h-full flex-col">
            <h2 className="mb-1 text-xl font-bold" style={headingStyle}>
              {slide.title}
            </h2>
            <span className="mb-5 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <div className="grid flex-1 grid-cols-2 gap-8">
              <ul
                className="flex flex-col justify-center space-y-4 border-r pr-6"
                style={{ ...bodyStyle, borderColor: c.textMuted + "30" }}
              >
                {slide.leftBullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-snug">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col justify-center space-y-4" style={bodyStyle}>
                {slide.rightBullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-snug">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
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
          <div className="flex h-full items-center gap-8">
            <div
              className="flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: c.surface }}
            >
              <IllustrationIcon size={56} strokeWidth={1.5} color={accent} />
            </div>
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-bold" style={headingStyle}>
                {slide.title}
              </h2>
              <span className="mb-3 inline-block h-1 w-14 rounded-full" style={{ backgroundColor: accent }} />
              <p className="text-base leading-relaxed" style={bodyStyle}>
                {slide.body}
              </p>
            </div>
          </div>
        );
      case "closing":
        return (
          <div
            className="relative flex h-full flex-col justify-center gap-5 overflow-hidden rounded-xl p-8"
            style={{ backgroundColor: c.primary }}
          >
            <span
              className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full opacity-10"
              style={{ backgroundColor: c.background }}
            />
            <h2 className="relative text-3xl font-bold" style={{ fontFamily: theme.headingFont, color: c.background }}>
              {slide.title || "Merci"}
            </h2>
            <ul className="relative space-y-3">
              {slide.bullets?.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-base"
                  style={{ color: c.background, opacity: 0.92 }}
                >
                  <span style={{ color: accent }}>→</span>
                  <span>{b}</span>
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
