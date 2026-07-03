"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type { Presentation, Slide, Theme } from "@/types/slide";
import { THEMES, getTheme } from "@/lib/themes";
import SlideList from "@/components/SlideList";
import ScaledSlide from "@/components/ScaledSlide";
import Inspector from "@/components/Inspector";
import PalettePicker from "@/components/PalettePicker";
import ThemeGrid from "@/components/ThemeGrid";
import { exportPresentationToPptx } from "@/lib/pptx-export";
import { exportPresentationToPdf } from "@/lib/pdf-export";
import { saveAutosave } from "@/lib/drafts";
import { useUndoRedo } from "@/lib/use-undo-redo";
import PresenterMode from "@/components/PresenterMode";
import {
  Download,
  Palette,
  Paintbrush,
  ArrowLeft,
  Loader2,
  Play,
  Undo2,
  Redo2,
  FileDown,
} from "lucide-react";
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const { commit, undo, redo, canUndo, canRedo } = useUndoRedo(presentation, onChange);

  const selected = presentation.slides.find((s) => s.id === selectedId) ?? presentation.slides[0];

  function updateSlides(slides: Slide[], opts?: { immediate?: boolean }) {
    commit({ ...presentation, slides }, opts);
  }

  function patchSlide(id: string, patch: Partial<Slide>, opts?: { immediate?: boolean }) {
    updateSlides(
      presentation.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      opts
    );
  }

  function replaceSlide(id: string, slide: Slide) {
    updateSlides(
      presentation.slides.map((s) => (s.id === id ? { ...slide, id } : s)),
      { immediate: true }
    );
  }

  function moveSlide(id: string, dir: -1 | 1) {
    const idx = presentation.slides.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (target < 0 || target >= presentation.slides.length) return;
    const next = [...presentation.slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateSlides(next, { immediate: true });
  }

  function reorderSlides(fromId: string, toId: string) {
    const fromIdx = presentation.slides.findIndex((s) => s.id === fromId);
    const toIdx = presentation.slides.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const next = [...presentation.slides];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateSlides(next, { immediate: true });
  }

  function duplicateSlide(id: string) {
    const idx = presentation.slides.findIndex((s) => s.id === id);
    const copy = { ...presentation.slides[idx], id: uuid() };
    const next = [...presentation.slides];
    next.splice(idx + 1, 0, copy);
    updateSlides(next, { immediate: true });
  }

  function deleteSlide(id: string) {
    if (presentation.slides.length <= 1) return;
    const next = presentation.slides.filter((s) => s.id !== id);
    updateSlides(next, { immediate: true });
    if (selectedId === id) setSelectedId(next[0]?.id);
  }

  function addSlide() {
    const s = emptySlide();
    updateSlides([...presentation.slides, s], { immediate: true });
    setSelectedId(s.id);
  }

  async function regenerateSelectedSlide() {
    if (!selected) return;
    setRegeneratingId(selected.id);
    try {
      const res = await fetch("/api/regenerate-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide: selected,
          themeId: presentation.themeId,
          language: presentation.language || "français",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la régénération.");
      replaceSlide(selected.id, data.slide);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la régénération.");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportPresentationToPptx(presentation, theme);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await exportPresentationToPdf(presentation, theme, accent);
    } finally {
      setExportingPdf(false);
    }
  }

  // Local autosave: keep the last few seconds of work recoverable across reloads.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveAutosave(presentation), 800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [presentation]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isEditableTarget) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [undo, redo]);

  return (
    <div className="flex h-screen flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border bg-surface/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center justify-self-start gap-2">
          <button onClick={onBack} className="btn-secondary px-3 py-1.5 text-xs">
            <ArrowLeft size={14} /> Nouveau
          </button>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            className="btn-secondary px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
            className="btn-secondary px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Redo2 size={14} />
          </button>
        </div>
        <input
          value={presentation.title}
          onChange={(e) => commit({ ...presentation, title: e.target.value })}
          className="w-full max-w-md justify-self-center rounded-lg bg-transparent px-2 py-1 text-center text-lg font-semibold text-white outline-none focus:bg-surface-2"
        />
        <div className="flex items-center justify-self-end gap-2">
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
          <button onClick={() => setPresenting(true)} className="btn-secondary px-3 py-1.5 text-xs">
            <Play size={14} /> Présenter
          </button>
          <button onClick={handleExportPdf} disabled={exportingPdf} className="btn-secondary px-3 py-1.5 text-xs">
            {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            PDF
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary px-4 py-1.5 text-xs">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter .pptx
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_320px] overflow-hidden">
        <aside className="min-h-0 overflow-hidden border-r border-border bg-surface/40 p-3">
          <SlideList
            slides={presentation.slides}
            theme={theme}
            accent={accent}
            selectedId={selected?.id ?? ""}
            onSelect={setSelectedId}
            onMove={moveSlide}
            onReorder={reorderSlides}
            onDuplicate={duplicateSlide}
            onDelete={deleteSlide}
            onAdd={addSlide}
          />
        </aside>

        <main className="flex items-center justify-center overflow-auto bg-canvas p-8">
          {selected && (
            <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
              <ScaledSlide
                slide={selected}
                theme={theme}
                accent={accent}
                editable
                onEdit={(patch) => patchSlide(selected.id, patch, { immediate: true })}
              />
            </div>
          )}
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-border bg-surface/40 p-4">
          {panel === "theme" && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Choisir un thème</h3>
              <ThemeGrid
                selectedId={presentation.themeId}
                onSelect={(themeId) => commit({ ...presentation, themeId })}
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
                onSelect={(id, colors) => commit({ ...presentation, paletteOverride: colors })}
              />
              {presentation.paletteOverride && (
                <button
                  className="mt-3 text-xs text-white/50 underline"
                  onClick={() => commit({ ...presentation, paletteOverride: undefined })}
                >
                  Réinitialiser au thème
                </button>
              )}
            </div>
          )}
          {panel === "content" && selected && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white/80">Contenu de la slide</h3>
              <p className="mb-3 -mt-2 text-[11px] text-white/40">
                Astuce : cliquez directement sur le texte dans l&apos;aperçu pour l&apos;éditer sur place.
              </p>
              <Inspector
                slide={selected}
                onChange={(patch) => patchSlide(selected.id, patch)}
                onRegenerate={regenerateSelectedSlide}
                regenerating={regeneratingId === selected.id}
              />
            </div>
          )}
        </aside>
      </div>

      {presenting && (
        <PresenterMode
          presentation={presentation}
          theme={theme}
          accent={accent}
          startIndex={Math.max(0, presentation.slides.findIndex((s) => s.id === selected?.id))}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
}
