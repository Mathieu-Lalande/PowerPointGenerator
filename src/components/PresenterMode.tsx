"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, NotebookText, Timer, ListOrdered } from "lucide-react";
import type { Presentation, Theme } from "@/types/slide";
import ScaledSlide from "@/components/ScaledSlide";
import clsx from "clsx";

interface Props {
  presentation: Presentation;
  theme: Theme;
  accent: string;
  startIndex: number;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PresenterMode({ presentation, theme, accent, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [showNotes, setShowNotes] = useState(false);
  const [rehearsing, setRehearsing] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = presentation.slides;
  const slide = slides[index];

  // Rehearsal timer: total elapsed since starting, plus time spent on each
  // slide (credited when navigating away), so a speaker can spot which
  // slides are running long.
  const [, forceTick] = useReducer((c) => c + 1, 0);
  const totalStartRef = useRef(0);
  const slideStartRef = useRef(0);
  const lastIndexRef = useRef(index);
  const perSlideMsRef = useRef<number[]>(Array(slides.length).fill(0));

  function toggleRehearsing() {
    setRehearsing((r) => {
      const next = !r;
      if (next) {
        const now = Date.now();
        totalStartRef.current = now;
        slideStartRef.current = now;
        lastIndexRef.current = index;
        perSlideMsRef.current = Array(slides.length).fill(0);
      } else {
        setShowRecap(false);
      }
      return next;
    });
  }

  useEffect(() => {
    if (!rehearsing) return;
    const id = setInterval(() => forceTick(), 1000);
    return () => clearInterval(id);
  }, [rehearsing]);

  useEffect(() => {
    if (!rehearsing) return;
    const now = Date.now();
    const prev = lastIndexRef.current;
    perSlideMsRef.current[prev] = (perSlideMsRef.current[prev] ?? 0) + (now - slideStartRef.current);
    slideStartRef.current = now;
    lastIndexRef.current = index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key.toLowerCase() === "n") {
        setShowNotes((s) => !s);
      } else if (e.key.toLowerCase() === "t") {
        toggleRehearsing();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goNext, goPrev, onClose]);

  const currentSlideMs = rehearsing ? Date.now() - slideStartRef.current : 0;
  const totalMs = rehearsing ? Date.now() - totalStartRef.current : 0;
  const paceColor = currentSlideMs > 120_000 ? "text-red-400" : currentSlideMs > 60_000 ? "text-amber-400" : "text-emerald-400";

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white/50">
        <span className="truncate">{presentation.title}</span>
        <div className="flex items-center gap-3">
          {rehearsing && (
            <>
              <span className={`tabular-nums font-semibold ${paceColor}`} title="Temps sur cette slide">
                {formatDuration(currentSlideMs)}
              </span>
              <span className="tabular-nums text-white/40" title="Temps total écoulé">
                total {formatDuration(totalMs)}
              </span>
              <button
                onClick={() => setShowRecap((s) => !s)}
                title="Récap par slide"
                className={`rounded p-1.5 hover:bg-white/10 ${showRecap ? "text-accent" : "text-white/50"}`}
              >
                <ListOrdered size={16} />
              </button>
            </>
          )}
          <span className="tabular-nums">
            {index + 1} / {slides.length}
          </span>
          <button
            onClick={toggleRehearsing}
            title="Mode répétition (T)"
            className={`rounded p-1.5 hover:bg-white/10 ${rehearsing ? "text-accent" : "text-white/50"}`}
          >
            <Timer size={16} />
          </button>
          <button
            onClick={() => setShowNotes((s) => !s)}
            title="Notes orateur (N)"
            className={`rounded p-1.5 hover:bg-white/10 ${showNotes ? "text-accent" : "text-white/50"}`}
          >
            <NotebookText size={16} />
          </button>
          <button onClick={onClose} title="Fermer (Échap)" className="rounded p-1.5 text-white/50 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-4">
        <button
          aria-label="Slide précédente"
          onClick={goPrev}
          disabled={index === 0}
          className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize"
        />
        <button
          aria-label="Slide suivante"
          onClick={goNext}
          disabled={index === slides.length - 1}
          className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize"
        />

        <button
          onClick={goPrev}
          disabled={index === 0}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-20 sm:left-6"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          key={index}
          className="animate-slide-enter aspect-video max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl"
          style={{ width: "min(100%, calc((100vh - 140px) * 16 / 9))" }}
        >
          <ScaledSlide slide={slide} theme={theme} accent={accent} animate logoDataUrl={presentation.brandKit?.logoDataUrl} />
        </div>

        <button
          onClick={goNext}
          disabled={index === slides.length - 1}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-20 sm:right-6"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {showRecap && rehearsing && (
        <div className="max-h-40 overflow-y-auto border-t border-white/10 bg-white/5 px-6 py-3 text-xs text-white/70">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-white/40">Temps passé par slide</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {slides.map((s, i) => {
              const ms = i === index ? perSlideMsRef.current[i] + currentSlideMs : perSlideMsRef.current[i] ?? 0;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span className={clsx("truncate", i === index && "text-accent")}>
                    #{i + 1} {s.title || "—"}
                  </span>
                  <span className="tabular-nums text-white/50">{formatDuration(ms)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showNotes && (
        <div className="border-t border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">Notes orateur</p>
          <p>{slide.notes || "Aucune note pour cette slide."}</p>
        </div>
      )}
    </div>
  );
}
