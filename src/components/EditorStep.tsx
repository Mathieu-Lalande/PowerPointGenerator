"use client";

import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Presentation, Slide, Theme } from "@/types/slide";
import { THEMES, getTheme } from "@/lib/themes";
import SlideList from "@/components/SlideList";
import ScaledSlide from "@/components/ScaledSlide";
import Inspector from "@/components/Inspector";
import PalettePicker from "@/components/PalettePicker";
import ThemeGrid from "@/components/ThemeGrid";
import { exportPresentationToPptx } from "@/lib/pptx-export";
import { Download, Palette, Paintbrush, ArrowLeft, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  presentation: Presentation;
  onChange: (p: Presentation) => void;
  onBack: () => void;
}

function emptySlide(): Slide {
  return {
    id: uuid(),
    layout: "title-bullets",
    title: "Nouvelle slide",
    bullets: ["Premier point"],
  };
}

export default function EditorStep({ presentation, onChange, onBack }: Props) {
  const theme: Theme = useMemo(() => getTheme(presentation.themeId), [presentation.themeId]);
  const accent = presentation.paletteOverride?.[0] || theme.colors.accent;
  const [selectedId, setSelectedId] = useState(presentation.slides[0]?.id);
  const [panel, setPanel] = useState<"content" | "theme" | "palette">("content");
  const [exporting, setExporting] = useState(false);

  const selected = presentation.slides.find((s) => s.id === selectedId) ?? presentation.slides[0];

  function updateSlides(slides: Slide[]) {
    onChange({ ...presentation, slides });
  }

  function patchSlide(id: string, patch: Partial<Slide>) {
    updateSlides(presentation.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function moveSlide(id: string, dir: -1 | 1) {
    const idx = presentation.slides.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (target < 0 || target >= presentation.slides.length) return;
    const next = [...presentation.slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateSlides(next);
  }

  function duplicateSlide(id: string) {
    const idx = presentation.slides.findIndex((s) => s.id === id);
    const copy = { ...presentation.slides[idx], id: uuid() };
    const next = [...presentation.slides];
    next.splice(idx + 1, 0, copy);
    updateSlides(next);
  }

  function deleteSlide(id: string) {
    if (presentation.slides.length <= 1) return;
    const next = presentation.slides.filter((s) => s.id !== id);
    updateSlides(next);
    if (selectedId === id) setSelectedId(next[0]?.id);
  }

  function addSlide() {
    const s = emptySlide();
    updateSlides([...presentation.slides, s]);
    setSelectedId(s.id);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportPresentationToPptx(presentation, theme);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-secondary px-3 py-1.5 text-xs">
            <ArrowLeft size={14} /> Nouveau
          </button>
          <input
            value={presentation.title}
            onChange={(e) => onChange({ ...presentation, title: e.target.value })}
            className="rounded-lg bg-transparent px-2 py-1 text-lg font-semibold text-white outline-none focus:bg-surface-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanel(panel === "theme" ? "content" : "theme")}
            className={clsx("btn-secondary px-3 py-1.5 text-xs", panel === "theme" && "border-accent")}
          >
            <Paintbrush size={14} /> Thème
          </button>
          <button
            onClick={() => setPanel(panel === "palette" ? "content" : "palette")}
            className={clsx("btn-secondary px-3 py-1.5 text-xs", panel === "palette" && "border-accent")}
          >
            <Palette size={14} /> Palette
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary px-4 py-1.5 text-xs">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter .pptx
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[220px_1fr_320px] overflow-hidden">
        <aside className="border-r border-border bg-surface/40 p-3">
          <SlideList
            slides={presentation.slides}
            theme={theme}
            accent={accent}
            selectedId={selected?.id ?? ""}
            onSelect={setSelectedId}
            onMove={moveSlide}
            onDuplicate={duplicateSlide}
            onDelete={deleteSlide}
            onAdd={addSlide}
          />
        </aside>

        <main className="flex items-center justify-center overflow-auto bg-canvas p-8">
          {selected && (
            <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
              <ScaledSlide slide={selected} theme={theme} accent={accent} />
            </div>
          )}
        </main>

        <aside className="overflow-y-auto border-l border-border bg-surface/40 p-4">
          {panel === "theme" && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Choisir un thème</h3>
              <ThemeGrid
                selectedId={presentation.themeId}
                onSelect={(themeId) => onChange({ ...presentation, themeId })}
                compact
              />
            </div>
          )}
          {panel === "palette" && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Palette de couleurs</h3>
              <p className="mb-3 text-xs text-white/50">
                Surcharge la couleur d&apos;accent du thème pour toute la présentation.
              </p>
              <PalettePicker
                onSelect={(id, colors) => onChange({ ...presentation, paletteOverride: colors })}
              />
              {presentation.paletteOverride && (
                <button
                  className="mt-3 text-xs text-white/50 underline"
                  onClick={() => onChange({ ...presentation, paletteOverride: undefined })}
                >
                  Réinitialiser au thème
                </button>
              )}
            </div>
          )}
          {panel === "content" && selected && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Contenu de la slide</h3>
              <Inspector slide={selected} onChange={(patch) => patchSlide(selected.id, patch)} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
