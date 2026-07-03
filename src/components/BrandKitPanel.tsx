"use client";

import { useRef } from "react";
import { Upload, X, Save, RotateCcw } from "lucide-react";
import type { BrandKit } from "@/types/slide";
import { SLIDE_FONT_NAMES } from "@/lib/themes";
import { saveGlobalBrandKit } from "@/lib/brand-kit";

interface Props {
  brandKit: BrandKit | undefined;
  onChange: (kit: BrandKit | undefined) => void;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function BrandKitPanel({ brandKit, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kit = brandKit ?? {};

  function patch(next: Partial<BrandKit>) {
    onChange({ ...kit, ...next });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      alert("Logo trop lourd (2 Mo maximum).");
      return;
    }
    patch({ logoDataUrl: await readFileAsDataUrl(file) });
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-white/50">
        Enregistrez le logo, les couleurs et les polices de votre entreprise une seule fois : ils
        s&apos;appliqueront automatiquement à toutes vos futures présentations.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Logo</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        {kit.logoDataUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kit.logoDataUrl}
              alt=""
              className="h-14 w-14 rounded-lg bg-white/5 object-contain ring-1 ring-white/10"
            />
            <button
              type="button"
              onClick={() => patch({ logoDataUrl: undefined })}
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
            <Upload size={14} /> Importer un logo
          </button>
        )}
        <p className="mt-1.5 text-[11px] text-white/40">Affiché en filigrane dans le coin de chaque slide.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Couleur principale</label>
          <input
            type="color"
            value={kit.primaryColor ?? "#0F3D91"}
            onChange={(e) => patch({ primaryColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface-2"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Couleur d&apos;accent</label>
          <input
            type="color"
            value={kit.accentColor ?? "#F2A93B"}
            onChange={(e) => patch({ accentColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Police des titres</label>
          <select
            value={kit.headingFont ?? ""}
            onChange={(e) => patch({ headingFont: e.target.value || undefined })}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white"
          >
            <option value="">Police du thème</option>
            {SLIDE_FONT_NAMES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Police du texte</label>
          <select
            value={kit.bodyFont ?? ""}
            onChange={(e) => patch({ bodyFont: e.target.value || undefined })}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-white"
          >
            <option value="">Police du thème</option>
            {SLIDE_FONT_NAMES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => saveGlobalBrandKit(kit)}
          className="btn-primary flex-1 justify-center py-2 text-xs"
        >
          <Save size={14} /> Enregistrer comme kit par défaut
        </button>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title="Retirer le kit de marque de cette présentation"
          className="btn-secondary px-3 py-2 text-xs"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
