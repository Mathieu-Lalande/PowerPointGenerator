"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ICON_LIBRARY } from "@/lib/icons";
import clsx from "clsx";

interface Props {
  value?: string;
  onSelect: (iconId: string) => void;
}

export default function IconPicker({ value, onSelect }: Props) {
  const [category, setCategory] = useState(ICON_LIBRARY[0].id);
  const active = ICON_LIBRARY.find((c) => c.id === category) ?? ICON_LIBRARY[0];

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {ICON_LIBRARY.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={clsx(
              "rounded-full px-2.5 py-1 text-[11px] transition",
              category === cat.id ? "bg-accent text-white" : "bg-surface-2 text-white/60 hover:text-white"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => onSelect("")}
            title="Retirer l'icône"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/40 text-red-300 hover:bg-red-400/10"
          >
            <X size={14} />
          </button>
        )}
        {active.icons.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => onSelect(id)}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-surface-2 hover:text-white",
              value === id && "bg-accent/20 text-accent ring-1 ring-accent"
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </div>
  );
}
