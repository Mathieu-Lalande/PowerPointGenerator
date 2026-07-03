"use client";

import { PALETTES } from "@/lib/palettes";
import clsx from "clsx";

interface Props {
  selectedId?: string;
  onSelect: (paletteId: string, colors: string[]) => void;
}

export default function PalettePicker({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id, p.colors)}
          className={clsx(
            "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition",
            selectedId === p.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
          )}
        >
          <div className="flex -space-x-1">
            {p.colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full border border-black/20"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <span className="text-xs text-white/70">{p.name}</span>
        </button>
      ))}
    </div>
  );
}
