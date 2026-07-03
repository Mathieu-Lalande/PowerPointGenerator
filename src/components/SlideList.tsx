"use client";

import { useState } from "react";
import type { Slide, Theme } from "@/types/slide";
import ScaledSlide from "@/components/ScaledSlide";
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, GripVertical } from "lucide-react";
import clsx from "clsx";

interface Props {
  slides: Slide[];
  theme: Theme;
  accent: string;
  selectedId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (fromId: string, toId: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function SlideList({
  slides,
  theme,
  accent,
  selectedId,
  onSelect,
  onMove,
  onReorder,
  onDuplicate,
  onDelete,
  onAdd,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable
          onClick={() => onSelect(slide.id)}
          onDragStart={(e) => {
            setDraggingId(slide.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            if (!draggingId || draggingId === slide.id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverId(slide.id);
          }}
          onDragLeave={() => {
            setOverId((cur) => (cur === slide.id ? null : cur));
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingId && draggingId !== slide.id) onReorder(draggingId, slide.id);
            setDraggingId(null);
            setOverId(null);
          }}
          className={clsx(
            "group relative cursor-pointer rounded-lg border p-1.5 transition",
            slide.id === selectedId ? "border-accent shadow-glow" : "border-border hover:border-accent/40",
            draggingId === slide.id && "opacity-40",
            overId === slide.id && draggingId !== slide.id && "ring-2 ring-accent/70"
          )}
        >
          <div className="mb-1 flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1 text-[10px] font-medium text-white/40">
              <GripVertical size={11} className="cursor-grab text-white/25" />#{i + 1}
            </span>
            <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(slide.id, -1);
                }}
                className="rounded p-0.5 text-white/50 hover:bg-surface-2 hover:text-white"
              >
                <ArrowUp size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(slide.id, 1);
                }}
                className="rounded p-0.5 text-white/50 hover:bg-surface-2 hover:text-white"
              >
                <ArrowDown size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(slide.id);
                }}
                className="rounded p-0.5 text-white/50 hover:bg-surface-2 hover:text-white"
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(slide.id);
                }}
                className="rounded p-0.5 text-white/50 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-md">
            <ScaledSlide slide={slide} theme={theme} accent={accent} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="btn-secondary mt-1 justify-center py-2 text-xs"
      >
        <Plus size={14} /> Ajouter une slide
      </button>
    </div>
  );
}
