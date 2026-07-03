"use client";

import { THEMES } from "@/lib/themes";
import clsx from "clsx";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export default function ThemeGrid({ selectedId, onSelect, compact }: Props) {
  return (
    <div className={clsx("grid gap-3", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
      {THEMES.map((theme) => {
        const active = theme.id === selectedId;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
            className={clsx(
              "group relative overflow-hidden rounded-xl border p-3 text-left transition",
              active ? "border-accent shadow-glow" : "border-border hover:border-accent/50"
            )}
            style={{ backgroundColor: theme.colors.background }}
          >
            <div
              className="mb-3 h-12 w-full rounded-lg"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div className="flex gap-1.5 mb-2">
              {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
              {theme.name}
            </p>
            {!compact && (
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                {theme.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
