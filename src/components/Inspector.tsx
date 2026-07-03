"use client";

import { useRef, useState } from "react";
import { Upload, X, Plus, Trash2, Wand2, Loader2, ImageIcon, FileSpreadsheet } from "lucide-react";
import type { Slide, SlideLayout, TeamMember } from "@/types/slide";
import IconPicker from "@/components/IconPicker";
import FramePicker from "@/components/FramePicker";
import ImagePicker from "@/components/ImagePicker";
import { DIAGRAM_TEMPLATES } from "@/lib/diagram";
import { parseChartFile } from "@/lib/parse-chart-file";

interface Props {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
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
  agenda: "Sommaire",
  stat: "Chiffre clé",
  comparison: "Comparaison (A vs B)",
  team: "Équipe",
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

export default function Inspector({ slide, onChange, onRegenerate, regenerating }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartFileInputRef = useRef<HTMLInputElement>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [chartImportError, setChartImportError] = useState<string | undefined>();

  async function handleChartFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setChartImportError(undefined);
    try {
      const chart = await parseChartFile(file);
      onChange({ chart });
    } catch (err) {
      setChartImportError(err instanceof Error ? err.message : "Fichier illisible.");
    }
  }

  function updateTeamMember(i: number, patch: Partial<TeamMember>) {
    const next = [...(slide.teamMembers ?? [])];
    next[i] = { ...next[i], ...patch };
    onChange({ teamMembers: next });
  }
  function addTeamMember() {
    onChange({ teamMembers: [...(slide.teamMembers ?? []), { name: "", role: "" }] });
  }
  function removeTeamMember(i: number) {
    onChange({ teamMembers: (slide.teamMembers ?? []).filter((_, idx) => idx !== i) });
  }

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
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="btn-secondary w-full justify-center py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {regenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Régénération...
            </>
          ) : (
            <>
              <Wand2 size={14} /> Régénérer cette slide avec l&apos;IA
            </>
          )}
        </button>
      )}

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

      {(slide.layout === "title-bullets" || slide.layout === "closing" || slide.layout === "agenda") && (
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

      {slide.layout === "comparison" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Titre gauche</label>
            <input
              value={slide.leftTitle ?? ""}
              onChange={(e) => onChange({ leftTitle: e.target.value })}
              className="input-field"
            />
            <label className="mb-1.5 mt-2 block text-xs font-medium text-white/50">Puces gauche</label>
            <textarea
              value={bulletsToText(slide.leftBullets)}
              onChange={(e) => onChange({ leftBullets: textToBullets(e.target.value) })}
              className="input-field h-28 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Titre droit</label>
            <input
              value={slide.rightTitle ?? ""}
              onChange={(e) => onChange({ rightTitle: e.target.value })}
              className="input-field"
            />
            <label className="mb-1.5 mt-2 block text-xs font-medium text-white/50">Puces droite</label>
            <textarea
              value={bulletsToText(slide.rightBullets)}
              onChange={(e) => onChange({ rightBullets: textToBullets(e.target.value) })}
              className="input-field h-28 resize-none"
            />
          </div>
        </div>
      )}

      {slide.layout === "stat" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Chiffre</label>
            <input
              value={slide.statValue ?? ""}
              onChange={(e) => onChange({ statValue: e.target.value })}
              className="input-field"
              placeholder="87%"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Libellé</label>
            <input
              value={slide.statLabel ?? ""}
              onChange={(e) => onChange({ statLabel: e.target.value })}
              className="input-field"
              placeholder="de satisfaction client"
            />
          </div>
        </div>
      )}

      {slide.layout === "team" && (
        <div className="space-y-2">
          <label className="mb-1.5 block text-xs font-medium text-white/50">Membres</label>
          {(slide.teamMembers ?? []).map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={m.name}
                onChange={(e) => updateTeamMember(i, { name: e.target.value })}
                placeholder="Nom"
                className="input-field"
              />
              <input
                value={m.role}
                onChange={(e) => updateTeamMember(i, { role: e.target.value })}
                placeholder="Rôle"
                className="input-field"
              />
              <button
                type="button"
                onClick={() => removeTeamMember(i)}
                className="shrink-0 rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTeamMember}
            className="btn-secondary w-full justify-center py-2 text-xs"
          >
            <Plus size={14} /> Ajouter un membre
          </button>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary justify-center py-2 text-xs"
                >
                  <Upload size={14} /> Importer
                </button>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="btn-secondary justify-center py-2 text-xs"
                >
                  <ImageIcon size={14} /> Banque d&apos;images
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showImagePicker && (
        <ImagePicker
          onSelect={(dataUrl) => onChange({ imageDataUrl: dataUrl })}
          onClose={() => setShowImagePicker(false)}
        />
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

      {slide.layout === "chart" && (
        <div className="space-y-1.5">
          <input
            ref={chartFileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChartFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => chartFileInputRef.current?.click()}
            className="btn-secondary w-full justify-center py-2 text-xs"
          >
            <FileSpreadsheet size={14} /> Importer un CSV / Excel
          </button>
          <p className="text-[11px] text-white/40">
            1<sup>re</sup> colonne = catégories, colonnes suivantes = séries (ligne d&apos;en-tête requise).
          </p>
          {chartImportError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {chartImportError}
            </p>
          )}
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
