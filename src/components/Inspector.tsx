"use client";

import type { Slide, SlideLayout } from "@/types/slide";
import IconPicker from "@/components/IconPicker";
import FramePicker from "@/components/FramePicker";

interface Props {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
}

const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title: "Titre",
  section: "Section",
  "title-bullets": "Titre + puces",
  "two-column": "Deux colonnes",
  quote: "Citation",
  chart: "Graphique",
  "image-text": "Icône + texte",
  closing: "Clôture",
};

function bulletsToText(b?: string[]) {
  return (b ?? []).join("\n");
}
function textToBullets(t: string) {
  return t.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function Inspector({ slide, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Layout</label>
        <select
          value={slide.layout}
          onChange={(e) => onChange({ layout: e.target.value as SlideLayout })}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white"
        >
          {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {slide.layout !== "quote" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Titre</label>
          <input
            value={slide.title ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
            className="input-field"
          />
        </div>
      )}

      {slide.layout === "title" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Sous-titre</label>
          <input
            value={slide.subtitle ?? ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="input-field"
          />
        </div>
      )}

      {(slide.layout === "title-bullets" || slide.layout === "closing") && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Puces (une par ligne)
          </label>
          <textarea
            value={bulletsToText(slide.bullets)}
            onChange={(e) => onChange({ bullets: textToBullets(e.target.value) })}
            className="input-field h-32 resize-none"
          />
        </div>
      )}

      {slide.layout === "two-column" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Colonne gauche</label>
            <textarea
              value={bulletsToText(slide.leftBullets)}
              onChange={(e) => onChange({ leftBullets: textToBullets(e.target.value) })}
              className="input-field h-28 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Colonne droite</label>
            <textarea
              value={bulletsToText(slide.rightBullets)}
              onChange={(e) => onChange({ rightBullets: textToBullets(e.target.value) })}
              className="input-field h-28 resize-none"
            />
          </div>
        </div>
      )}

      {slide.layout === "quote" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Citation</label>
            <textarea
              value={slide.body ?? ""}
              onChange={(e) => onChange({ body: e.target.value })}
              className="input-field h-24 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Auteur</label>
            <input
              value={slide.quoteAuthor ?? ""}
              onChange={(e) => onChange({ quoteAuthor: e.target.value })}
              className="input-field"
            />
          </div>
        </>
      )}

      {slide.layout === "image-text" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Texte</label>
          <textarea
            value={slide.body ?? ""}
            onChange={(e) => onChange({ body: e.target.value })}
            className="input-field h-28 resize-none"
          />
        </div>
      )}

      {slide.layout === "chart" && slide.chart && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Type de graphique</label>
            <select
              value={slide.chart.type}
              onChange={(e) =>
                onChange({ chart: { ...slide.chart!, type: e.target.value as any } })
              }
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white"
            >
              <option value="bar">Barres</option>
              <option value="line">Courbe</option>
              <option value="pie">Camembert</option>
              <option value="donut">Anneau</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Catégories (séparées par virgules)
            </label>
            <input
              value={slide.chart.categories.join(", ")}
              onChange={(e) =>
                onChange({
                  chart: {
                    ...slide.chart!,
                    categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="input-field"
            />
          </div>
          {slide.chart.series.map((s, si) => (
            <div key={si}>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Série &quot;{s.name}&quot; (valeurs séparées par virgules)
              </label>
              <input
                value={s.values.join(", ")}
                onChange={(e) => {
                  const values = e.target.value
                    .split(",")
                    .map((v) => Number(v.trim()))
                    .filter((v) => !Number.isNaN(v));
                  const series = [...slide.chart!.series];
                  series[si] = { ...series[si], values };
                  onChange({ chart: { ...slide.chart!, series } });
                }}
                className="input-field"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Icône</label>
        <IconPicker value={slide.icon} onSelect={(icon) => onChange({ icon: icon || undefined })} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Cadre</label>
        <FramePicker value={slide.frame} onSelect={(frame) => onChange({ frame })} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Notes orateur</label>
        <textarea
          value={slide.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="input-field h-20 resize-none text-xs"
        />
      </div>
    </div>
  );
}
