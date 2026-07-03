"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, NotebookText } from "lucide-react";
import type { Presentation, Theme } from "@/types/slide";
import ScaledSlide from "@/components/ScaledSlide";

interface Props {
  presentation: Presentation;
  theme: Theme;
  accent: string;
  startIndex: number;
  onClose: () => void;
}

export default function PresenterMode({ presentation, theme, accent, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [showNotes, setShowNotes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = presentation.slides;
  const slide = slides[index];

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
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white/50">
        <span className="truncate">{presentation.title}</span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {index + 1} / {slides.length}
          </span>
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
          className="aspect-video max-h-full max-w-full overflow-hidden rounded-lg shadow-2xl"
          style={{ width: "min(100%, calc((100vh - 140px) * 16 / 9))" }}
        >
          <ScaledSlide slide={slide} theme={theme} accent={accent} />
        </div>

        <button
          onClick={goNext}
          disabled={index === slides.length - 1}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-20 sm:right-6"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {showNotes && (
        <div className="border-t border-white/10 bg-white/5 px-6 py-3 text-sm text-white/70">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/40">Notes orateur</p>
          <p>{slide.notes || "Aucune note pour cette slide."}</p>
        </div>
      )}
    </div>
  );
}
