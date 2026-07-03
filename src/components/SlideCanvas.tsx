"use client";

import type { CSSProperties, FocusEvent } from "react";
import type { Slide, Theme } from "@/types/slide";
import { getFrame } from "@/lib/frames";
import { getIconComponent, DEFAULT_ILLUSTRATION_ICON } from "@/lib/icons";
import { resolveFontFamily } from "@/lib/fonts";
import MiniChart from "@/components/MiniChart";
import DiagramPreview from "@/components/DiagramPreview";
import { UserRound } from "lucide-react";
import clsx from "clsx";

interface Props {
  slide: Slide;
  theme: Theme;
  accent: string;
  /** Staggers bullet entrances (used in presenter mode; off while editing). */
  animate?: boolean;
  /** Lets the user click text directly on the canvas to edit it (used in the editor's main preview). */
  editable?: boolean;
  onEdit?: (patch: Partial<Slide>) => void;
}

type EditableTag = "div" | "span" | "h1" | "h2" | "h3" | "p";

export default function SlideCanvas({ slide, theme, accent, animate = false, editable = false, onEdit }: Props) {
  const c = theme.colors;
  const frame = getFrame(slide.frame);
  const headingFont = resolveFontFamily(theme.headingFont);
  const bodyFont = resolveFontFamily(theme.bodyFont);
  const headingStyle: CSSProperties = { fontFamily: headingFont, color: c.text };
  const bodyStyle: CSSProperties = { fontFamily: bodyFont, color: c.text };
  const SlideIcon = getIconComponent(slide.icon);
  const IllustrationIcon = getIconComponent(slide.icon) ?? getIconComponent(DEFAULT_ILLUSTRATION_ICON)!;

  function bulletDelay(i: number): CSSProperties | undefined {
    if (!animate) return undefined;
    return {
      animation: "bullet-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      animationDelay: `${0.15 + i * 0.09}s`,
    };
  }

  function Editable({
    value,
    onCommit,
    as = "div",
    className,
    style,
  }: {
    value: string;
    onCommit: (v: string) => void;
    as?: EditableTag;
    className?: string;
    style?: CSSProperties;
  }) {
    const Tag = as as any;
    return (
      <Tag
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e: FocusEvent<HTMLElement>) => {
          if (!editable) return;
          const next = e.currentTarget.textContent ?? "";
          if (next !== value) onCommit(next);
        }}
        onClick={(e: React.MouseEvent) => editable && e.stopPropagation()}
        className={clsx(className, editable && "cursor-text rounded outline-none focus:bg-white/10 focus:ring-1 focus:ring-accent/60")}
        style={style}
      >
        {value}
      </Tag>
    );
  }

  function editableBulletList(field: "bullets" | "leftBullets" | "rightBullets") {
    return (i: number, v: string) => {
      const next = [...(slide[field] ?? [])];
      next[i] = v;
      onEdit?.({ [field]: next } as Partial<Slide>);
    };
  }

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
            <Editable
              as="h1"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="relative text-4xl font-bold"
              style={{ fontFamily: headingFont, color: c.background }}
            />
            {(slide.subtitle || editable) && (
              <Editable
                as="p"
                value={slide.subtitle ?? ""}
                onCommit={(v) => onEdit?.({ subtitle: v })}
                className="relative text-lg"
                style={{ fontFamily: bodyFont, color: c.background, opacity: 0.85 }}
              />
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
            <Editable
              as="h2"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="text-3xl font-bold"
              style={headingStyle}
            />
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
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="text-2xl font-bold leading-tight"
                style={headingStyle}
              />
            </div>
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <ul className="flex flex-1 flex-col justify-center space-y-5" style={bodyStyle}>
              {slide.bullets?.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base leading-snug" style={bulletDelay(i)}>
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                  <Editable value={b} onCommit={(v) => editableBulletList("bullets")(i, v)} as="span" className="flex-1" />
                </li>
              ))}
            </ul>
          </div>
        );
      case "two-column":
        return (
          <div className="flex h-full flex-col">
            <Editable
              as="h2"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="mb-1 text-xl font-bold"
              style={headingStyle}
            />
            <span className="mb-5 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <div className="grid flex-1 grid-cols-2 gap-8">
              <ul
                className="flex flex-col justify-center space-y-4 border-r pr-6"
                style={{ ...bodyStyle, borderColor: c.textMuted + "30" }}
              >
                {slide.leftBullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-snug" style={bulletDelay(i)}>
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <Editable value={b} onCommit={(v) => editableBulletList("leftBullets")(i, v)} as="span" className="flex-1" />
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col justify-center space-y-4" style={bodyStyle}>
                {slide.rightBullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-snug" style={bulletDelay(i)}>
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <Editable value={b} onCommit={(v) => editableBulletList("rightBullets")(i, v)} as="span" className="flex-1" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Editable
              as="p"
              value={slide.body ?? ""}
              onCommit={(v) => onEdit?.({ body: v })}
              className="max-w-md text-2xl italic"
              style={headingStyle}
            />
            {(slide.quoteAuthor || editable) && (
              <Editable
                as="p"
                value={slide.quoteAuthor ? `— ${slide.quoteAuthor}` : ""}
                onCommit={(v) => onEdit?.({ quoteAuthor: v.replace(/^—\s*/, "") })}
                className="text-sm"
                style={{ color: c.textMuted }}
              />
            )}
          </div>
        );
      case "chart":
        return (
          <div className="flex h-full flex-col gap-3">
            <Editable
              as="h2"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="text-xl font-bold"
              style={headingStyle}
            />
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
              className="flex h-36 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl"
              style={{ backgroundColor: c.surface }}
            >
              {slide.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.imageDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <IllustrationIcon size={56} strokeWidth={1.5} color={accent} />
              )}
            </div>
            <div className="flex-1">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="mb-2 text-xl font-bold"
                style={headingStyle}
              />
              <span className="mb-3 inline-block h-1 w-14 rounded-full" style={{ backgroundColor: accent }} />
              <Editable
                as="p"
                value={slide.body ?? ""}
                onCommit={(v) => onEdit?.({ body: v })}
                className="text-base leading-relaxed"
                style={bodyStyle}
              />
            </div>
          </div>
        );
      case "diagram":
        return (
          <div className="flex h-full flex-col gap-3">
            <Editable
              as="h2"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="text-xl font-bold"
              style={headingStyle}
            />
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-inner">
              <DiagramPreview code={slide.diagramCode} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        );
      case "agenda":
        return (
          <div className="flex h-full flex-col">
            <Editable
              as="h2"
              value={slide.title || "Sommaire"}
              onCommit={(v) => onEdit?.({ title: v })}
              className="mb-1 text-2xl font-bold"
              style={headingStyle}
            />
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <ul className="flex flex-1 flex-col justify-center space-y-4">
              {slide.bullets?.map((b, i) => (
                <li key={i} className="flex items-center gap-4" style={bulletDelay(i)}>
                  <span
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ backgroundColor: accent + "1f", color: accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Editable
                    value={b}
                    onCommit={(v) => editableBulletList("bullets")(i, v)}
                    as="span"
                    className="flex-1 text-base"
                    style={bodyStyle}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      case "stat":
        return (
          <div
            className="relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl p-8 text-center"
            style={{ backgroundColor: c.primary }}
          >
            <span
              className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full opacity-10"
              style={{ backgroundColor: c.background }}
            />
            {slide.title && (
              <p className="relative text-sm font-semibold uppercase tracking-wide opacity-80" style={{ color: c.background }}>
                {slide.title}
              </p>
            )}
            <Editable
              as="h1"
              value={slide.statValue || "0"}
              onCommit={(v) => onEdit?.({ statValue: v })}
              className="relative text-7xl font-extrabold leading-none"
              style={{ fontFamily: headingFont, color: c.background }}
            />
            <Editable
              as="p"
              value={slide.statLabel ?? ""}
              onCommit={(v) => onEdit?.({ statLabel: v })}
              className="relative max-w-md text-lg"
              style={{ fontFamily: bodyFont, color: c.background, opacity: 0.85 }}
            />
          </div>
        );
      case "comparison":
        return (
          <div className="flex h-full flex-col">
            <Editable
              as="h2"
              value={slide.title ?? ""}
              onCommit={(v) => onEdit?.({ title: v })}
              className="mb-5 text-xl font-bold"
              style={headingStyle}
            />
            <div className="relative grid flex-1 grid-cols-2 gap-8">
              <div className="flex flex-col">
                <Editable
                  as="h3"
                  value={slide.leftTitle ?? ""}
                  onCommit={(v) => onEdit?.({ leftTitle: v })}
                  className="mb-3 text-base font-bold"
                  style={{ color: accent }}
                />
                <ul className="flex flex-1 flex-col justify-center space-y-3">
                  {slide.leftBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ ...bodyStyle, ...bulletDelay(i) }}>
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                      <Editable value={b} onCommit={(v) => editableBulletList("leftBullets")(i, v)} as="span" className="flex-1" />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col border-l pl-8" style={{ borderColor: c.textMuted + "30" }}>
                <Editable
                  as="h3"
                  value={slide.rightTitle ?? ""}
                  onCommit={(v) => onEdit?.({ rightTitle: v })}
                  className="mb-3 text-base font-bold"
                  style={{ color: c.secondary }}
                />
                <ul className="flex flex-1 flex-col justify-center space-y-3">
                  {slide.rightBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ ...bodyStyle, ...bulletDelay(i) }}>
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: c.secondary }} />
                      <Editable value={b} onCommit={(v) => editableBulletList("rightBullets")(i, v)} as="span" className="flex-1" />
                    </li>
                  ))}
                </ul>
              </div>
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-extrabold"
                style={{ backgroundColor: c.background, color: c.text, boxShadow: "0 0 0 4px " + c.background }}
              >
                VS
              </span>
            </div>
          </div>
        );
      case "team":
        return (
          <div className="flex h-full flex-col">
            <Editable
              as="h2"
              value={slide.title || "L'équipe"}
              onCommit={(v) => onEdit?.({ title: v })}
              className="mb-1 text-2xl font-bold"
              style={headingStyle}
            />
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <div className="grid flex-1 grid-cols-3 gap-5">
              {(slide.teamMembers ?? []).map((member, i) => (
                <div key={i} className="flex flex-col items-center text-center" style={bulletDelay(i)}>
                  <span
                    className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: accent + "1a" }}
                  >
                    <UserRound size={28} color={accent} strokeWidth={1.5} />
                  </span>
                  <Editable
                    as="p"
                    value={member.name}
                    onCommit={(v) => {
                      const next = [...(slide.teamMembers ?? [])];
                      next[i] = { ...next[i], name: v };
                      onEdit?.({ teamMembers: next });
                    }}
                    className="text-sm font-bold"
                    style={{ color: c.text }}
                  />
                  <Editable
                    as="p"
                    value={member.role}
                    onCommit={(v) => {
                      const next = [...(slide.teamMembers ?? [])];
                      next[i] = { ...next[i], role: v };
                      onEdit?.({ teamMembers: next });
                    }}
                    className="text-xs"
                    style={{ color: c.textMuted }}
                  />
                </div>
              ))}
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
            <Editable
              as="h2"
              value={slide.title || "Merci"}
              onCommit={(v) => onEdit?.({ title: v })}
              className="relative text-3xl font-bold"
              style={{ fontFamily: headingFont, color: c.background }}
            />
            <ul className="relative space-y-3">
              {slide.bullets?.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-base"
                  style={{ color: c.background, opacity: 0.92, ...bulletDelay(i) }}
                >
                  <span style={{ color: accent }}>→</span>
                  <Editable value={b} onCommit={(v) => editableBulletList("bullets")(i, v)} as="span" className="flex-1" />
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
