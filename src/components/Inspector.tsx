"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import type { Slide, SlideLayout } from "@/types/slide";
import IconPicker from "@/components/IconPicker";
import FramePicker from "@/components/FramePicker";
import { DIAGRAM_TEMPLATES } from "@/lib/diagram";

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
  diagram: "Diagramme (UML/BPMN)",
  closing: "Clôture",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function bulletsToText(b?: string[]) {
  return (b ?? []).join("\n");
}
function textToBullets(t: string) {
  return t.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function Inspector({ slide, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Image trop lourde (4 Mo maximum).");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ imageDataUrl: dataUrl });
  }

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
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Texte</label>
            <textarea
              value={slide.body ?? ""}
              onChange={(e) => onChange({ body: e.target.value })}
              className="input-field h-28 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Image / logo (sinon une icône est utilisée)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {slide.imageDataUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageDataUrl}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => onChange({ imageDataUrl: undefined })}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  <X size={14} /> Retirer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary w-full justify-center py-2 text-xs"
              >
                <Upload size={14} /> Importer une image
              </button>
            )}
          </div>
        </>
      )}

      {slide.layout === "diagram" && (
        <div className="space-y-2">
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Diagramme (syntaxe Mermaid)
          </label>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {DIAGRAM_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ diagramCode: t.code })}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-white/60 transition hover:text-white"
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={slide.diagramCode ?? ""}
            onChange={(e) => onChange({ diagramCode: e.target.value })}
            placeholder="flowchart TD&#10;    A[Début] --> B[Fin]"
            className="input-field h-40 resize-none font-mono text-xs"
          />
          <p className="text-[11px] text-white/40">
            Syntaxe{" "}
            <a
              href="https://mermaid.js.org/intro/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Mermaid
            </a>{" "}
            : flowchart, sequenceDiagram, classDiagram...
          </p>
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

      {slide.layout !== "diagram" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Icône</label>
          <IconPicker value={slide.icon} onSelect={(icon) => onChange({ icon: icon || undefined })} />
        </div>
      )}

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
