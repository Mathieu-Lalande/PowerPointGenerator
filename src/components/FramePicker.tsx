"use client";

import { FRAME_STYLES } from "@/lib/frames";
import clsx from "clsx";

interface Props {
  value?: string;
  onSelect: (id: string) => void;
}

export default function FramePicker({ value, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {FRAME_STYLES.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onSelect(f.id)}
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs transition",
            (value ?? "none") === f.id
              ? "border-accent bg-accent/10 text-white"
              : "border-border text-white/60 hover:border-accent/50"
          )}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
}
