"use client";

import { useRef } from "react";
import type { CSSProperties, FocusEvent } from "react";
import type { BoxOverride, Slide, Theme } from "@/types/slide";
import { getFrame } from "@/lib/frames";
import { getIconComponent, DEFAULT_ILLUSTRATION_ICON } from "@/lib/icons";
import { resolveFontFamily } from "@/lib/fonts";
import MiniChart from "@/components/MiniChart";
import DiagramPreview from "@/components/DiagramPreview";
import { UserRound, Move, X } from "lucide-react";
import clsx from "clsx";

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

interface Props {
  slide: Slide;
  theme: Theme;
  accent: string;
  /** Staggers bullet entrances (used in presenter mode; off while editing). */
  animate?: boolean;
  /** Lets the user click text directly on the canvas to edit it (used in the editor's main preview). */
  editable?: boolean;
  onEdit?: (patch: Partial<Slide>) => void;
  /** Brand kit logo, shown as a small watermark in the corner of every slide. */
  logoDataUrl?: string;
}

type EditableTag = "div" | "span" | "h1" | "h2" | "h3" | "p";

export default function SlideCanvas({
  slide,
  theme,
  accent,
  animate = false,
  editable = false,
  onEdit,
  logoDataUrl,
}: Props) {
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

  function commitOverride(slotKey: string, box: BoxOverride) {
    onEdit?.({ textOverrides: { ...(slide.textOverrides ?? {}), [slotKey]: box } });
  }

  function resetOverride(slotKey: string) {
    const next = { ...(slide.textOverrides ?? {}) };
    delete next[slotKey];
    onEdit?.({ textOverrides: next });
  }

  /**
   * Wraps a block of slide content so it can be freely dragged/resized on the
   * canvas. Without an override it stays in the normal flow (`className` is
   * whatever layout classes the caller needs); the first drag/resize detaches
   * it into an absolutely-positioned box (percentages of the slide canvas),
   * persisted on `slide.textOverrides[slotKey]`.
   */
  function Movable({
    slotKey,
    className,
    children,
  }: {
    slotKey: string;
    className?: string;
    children: React.ReactNode;
  }) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const override = slide.textOverrides?.[slotKey];

    function beginGesture(
      e: React.MouseEvent,
      mode: "move" | "resize"
    ) {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = wrapperRef.current;
      const container = wrapper?.offsetParent as HTMLElement | null;
      if (!wrapper || !container) return;

      const startRect = wrapper.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const startXPct = ((startRect.left - containerRect.left) / containerRect.width) * 100;
      const startYPct = ((startRect.top - containerRect.top) / containerRect.height) * 100;
      const wPct = (startRect.width / containerRect.width) * 100;
      const hPct = (startRect.height / containerRect.height) * 100;
      const startClientX = e.clientX;
      const startClientY = e.clientY;

      if (!override) {
        wrapper.style.position = "absolute";
        wrapper.style.left = `${startXPct}%`;
        wrapper.style.top = `${startYPct}%`;
        wrapper.style.width = `${wPct}%`;
        wrapper.style.height = `${hPct}%`;
      }

      let finalBox: BoxOverride = { x: startXPct, y: startYPct, w: wPct, h: hPct };

      function onMove(ev: MouseEvent) {
        const dxPct = ((ev.clientX - startClientX) / containerRect.width) * 100;
        const dyPct = ((ev.clientY - startClientY) / containerRect.height) * 100;
        if (mode === "move") {
          const nx = clamp(startXPct + dxPct, 0, Math.max(0, 100 - wPct));
          const ny = clamp(startYPct + dyPct, 0, Math.max(0, 100 - hPct));
          wrapper!.style.left = `${nx}%`;
          wrapper!.style.top = `${ny}%`;
          finalBox = { x: nx, y: ny, w: wPct, h: hPct };
        } else {
          const nw = clamp(wPct + dxPct, 6, 100 - startXPct);
          const nh = clamp(hPct + dyPct, 4, 100 - startYPct);
          wrapper!.style.width = `${nw}%`;
          wrapper!.style.height = `${nh}%`;
          finalBox = { x: startXPct, y: startYPct, w: nw, h: nh };
        }
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        commitOverride(slotKey, finalBox);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp, { once: true });
    }

    return (
      <div
        ref={wrapperRef}
        className={clsx(className, editable && "group/movable relative")}
        style={
          override
            ? { position: "absolute", left: `${override.x}%`, top: `${override.y}%`, width: `${override.w}%`, height: `${override.h}%` }
            : undefined
        }
      >
        {children}
        {editable && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded border border-dashed border-transparent transition group-hover/movable:border-accent/60" />
            <span
              role="button"
              title="Déplacer"
              onMouseDown={(e) => beginGesture(e, "move")}
              className="pointer-events-none absolute -left-2 -top-2 z-10 hidden h-4 w-4 cursor-move items-center justify-center rounded-full bg-accent text-white group-hover/movable:pointer-events-auto group-hover/movable:flex"
            >
              <Move size={10} />
            </span>
            <span
              role="button"
              title="Redimensionner"
              onMouseDown={(e) => beginGesture(e, "resize")}
              className="pointer-events-none absolute -bottom-2 -right-2 z-10 hidden h-4 w-4 cursor-nwse-resize items-center justify-center rounded-full bg-accent text-white group-hover/movable:pointer-events-auto group-hover/movable:flex"
            />
            {override && (
              <span
                role="button"
                title="Réinitialiser la position"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetOverride(slotKey);
                }}
                className="pointer-events-none absolute -right-2 -top-2 z-10 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white group-hover/movable:pointer-events-auto group-hover/movable:flex"
              >
                <X size={10} />
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  const base = (
    <div
      className={clsx("relative flex h-full w-full flex-col overflow-hidden p-8", frame.previewClass)}
      style={{ backgroundColor: c.background, color: c.text }}
    >
      {renderContent()}
      {logoDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoDataUrl}
          alt=""
          className="pointer-events-none absolute bottom-3 right-3 z-20 h-7 max-w-[15%] object-contain opacity-90"
        />
      )}
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
            <Movable slotKey="title">
              <Editable
                as="h1"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="relative text-4xl font-bold"
                style={{ fontFamily: headingFont, color: c.background }}
              />
            </Movable>
            {(slide.subtitle || editable) && (
              <Movable slotKey="subtitle">
                <Editable
                  as="p"
                  value={slide.subtitle ?? ""}
                  onCommit={(v) => onEdit?.({ subtitle: v })}
                  className="relative text-lg"
                  style={{ fontFamily: bodyFont, color: c.background, opacity: 0.85 }}
                />
              </Movable>
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
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="text-3xl font-bold"
                style={headingStyle}
              />
            </Movable>
          </div>
        );
      case "title-bullets":
        return (
          <div className="flex h-full flex-col">
            <Movable slotKey="header" className="mb-3 flex items-center gap-3">
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
            </Movable>
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <Movable slotKey="bullets" className="flex flex-1 flex-col justify-center">
              <ul className="space-y-5" style={bodyStyle}>
                {slide.bullets?.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-base leading-snug" style={bulletDelay(i)}>
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <Editable value={b} onCommit={(v) => editableBulletList("bullets")(i, v)} as="span" className="flex-1" />
                  </li>
                ))}
              </ul>
            </Movable>
          </div>
        );
      case "two-column":
        return (
          <div className="flex h-full flex-col">
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="mb-1 text-xl font-bold"
                style={headingStyle}
              />
            </Movable>
            <span className="mb-5 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <div className="grid flex-1 grid-cols-2 gap-8">
              <Movable slotKey="leftBullets" className="flex flex-col justify-center border-r pr-6" >
                <ul className="space-y-4" style={{ ...bodyStyle, borderColor: c.textMuted + "30" }}>
                  {slide.leftBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-snug" style={bulletDelay(i)}>
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                      <Editable value={b} onCommit={(v) => editableBulletList("leftBullets")(i, v)} as="span" className="flex-1" />
                    </li>
                  ))}
                </ul>
              </Movable>
              <Movable slotKey="rightBullets" className="flex flex-col justify-center">
                <ul className="space-y-4" style={bodyStyle}>
                  {slide.rightBullets?.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-snug" style={bulletDelay(i)}>
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                      <Editable value={b} onCommit={(v) => editableBulletList("rightBullets")(i, v)} as="span" className="flex-1" />
                    </li>
                  ))}
                </ul>
              </Movable>
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Movable slotKey="body">
              <Editable
                as="p"
                value={slide.body ?? ""}
                onCommit={(v) => onEdit?.({ body: v })}
                className="max-w-md text-2xl italic"
                style={headingStyle}
              />
            </Movable>
            {(slide.quoteAuthor || editable) && (
              <Movable slotKey="quoteAuthor">
                <Editable
                  as="p"
                  value={slide.quoteAuthor ? `— ${slide.quoteAuthor}` : ""}
                  onCommit={(v) => onEdit?.({ quoteAuthor: v.replace(/^—\s*/, "") })}
                  className="text-sm"
                  style={{ color: c.textMuted }}
                />
              </Movable>
            )}
          </div>
        );
      case "chart":
        return (
          <div className="flex h-full flex-col gap-3">
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="text-xl font-bold"
                style={headingStyle}
              />
            </Movable>
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
              <Movable slotKey="title">
                <Editable
                  as="h2"
                  value={slide.title ?? ""}
                  onCommit={(v) => onEdit?.({ title: v })}
                  className="mb-2 text-xl font-bold"
                  style={headingStyle}
                />
              </Movable>
              <span className="mb-3 inline-block h-1 w-14 rounded-full" style={{ backgroundColor: accent }} />
              <Movable slotKey="body">
                <Editable
                  as="p"
                  value={slide.body ?? ""}
                  onCommit={(v) => onEdit?.({ body: v })}
                  className="text-base leading-relaxed"
                  style={bodyStyle}
                />
              </Movable>
            </div>
          </div>
        );
      case "diagram":
        return (
          <div className="flex h-full flex-col gap-3">
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="text-xl font-bold"
                style={headingStyle}
              />
            </Movable>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-inner">
              <DiagramPreview code={slide.diagramCode} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        );
      case "agenda":
        return (
          <div className="flex h-full flex-col">
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title || "Sommaire"}
                onCommit={(v) => onEdit?.({ title: v })}
                className="mb-1 text-2xl font-bold"
                style={headingStyle}
              />
            </Movable>
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <Movable slotKey="bullets" className="flex flex-1 flex-col justify-center">
              <ul className="space-y-4">
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
            </Movable>
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
              <Movable slotKey="title">
                <p className="relative text-sm font-semibold uppercase tracking-wide opacity-80" style={{ color: c.background }}>
                  {slide.title}
                </p>
              </Movable>
            )}
            <Movable slotKey="statValue">
              <Editable
                as="h1"
                value={slide.statValue || "0"}
                onCommit={(v) => onEdit?.({ statValue: v })}
                className="relative text-7xl font-extrabold leading-none"
                style={{ fontFamily: headingFont, color: c.background }}
              />
            </Movable>
            <Movable slotKey="statLabel">
              <Editable
                as="p"
                value={slide.statLabel ?? ""}
                onCommit={(v) => onEdit?.({ statLabel: v })}
                className="relative max-w-md text-lg"
                style={{ fontFamily: bodyFont, color: c.background, opacity: 0.85 }}
              />
            </Movable>
          </div>
        );
      case "comparison":
        return (
          <div className="flex h-full flex-col">
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title ?? ""}
                onCommit={(v) => onEdit?.({ title: v })}
                className="mb-5 text-xl font-bold"
                style={headingStyle}
              />
            </Movable>
            <div className="relative grid flex-1 grid-cols-2 gap-8">
              <Movable slotKey="leftColumn" className="flex flex-col">
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
              </Movable>
              <Movable slotKey="rightColumn" className="flex flex-col border-l pl-8" >
                <div style={{ borderColor: c.textMuted + "30" }}>
                  <Editable
                    as="h3"
                    value={slide.rightTitle ?? ""}
                    onCommit={(v) => onEdit?.({ rightTitle: v })}
                    className="mb-3 text-base font-bold"
                    style={{ color: c.secondary }}
                  />
                  <ul className="flex flex-col space-y-3">
                    {slide.rightBullets?.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ ...bodyStyle, ...bulletDelay(i) }}>
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: c.secondary }} />
                        <Editable value={b} onCommit={(v) => editableBulletList("rightBullets")(i, v)} as="span" className="flex-1" />
                      </li>
                    ))}
                  </ul>
                </div>
              </Movable>
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
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title || "L'équipe"}
                onCommit={(v) => onEdit?.({ title: v })}
                className="mb-1 text-2xl font-bold"
                style={headingStyle}
              />
            </Movable>
            <span className="mb-6 h-1 w-14 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
            <Movable slotKey="teamGrid" className="flex-1">
              <div className="grid grid-cols-3 gap-5">
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
            </Movable>
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
            <Movable slotKey="title">
              <Editable
                as="h2"
                value={slide.title || "Merci"}
                onCommit={(v) => onEdit?.({ title: v })}
                className="relative text-3xl font-bold"
                style={{ fontFamily: headingFont, color: c.background }}
              />
            </Movable>
            <Movable slotKey="bullets">
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
            </Movable>
          </div>
        );
      default:
        return null;
    }
  }

  return base;
}
