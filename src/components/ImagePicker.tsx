"use client";

import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import type { ImageResult } from "@/lib/image-search";

interface Props {
  onSelect: (dataUrl: string) => void;
  onClose: () => void;
}

export default function ImagePicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de recherche.");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de recherche.");
    } finally {
      setSearching(false);
    }
  }

  async function pickImage(img: ImageResult) {
    setImportingId(img.id);
    setError(undefined);
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(img.fullUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'import.");
      onSelect(data.dataUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'import.");
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Banque d&apos;images libres de droits</h3>
          <button onClick={onClose} className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="mb-4 flex gap-2"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une image (ex : équipe, bureau, croissance...)"
            className="input-field flex-1"
          />
          <button type="submit" disabled={searching} className="btn-primary px-4 text-xs">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </form>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto">
          {results.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => pickImage(img)}
              disabled={importingId !== null}
              className="group relative aspect-square overflow-hidden rounded-lg bg-surface-2 disabled:cursor-wait"
              title={`Photo par ${img.credit}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl} alt={img.alt} className="h-full w-full object-cover transition group-hover:scale-105" />
              {importingId === img.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={18} className="animate-spin text-white" />
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[9px] text-white/80 opacity-0 transition group-hover:opacity-100">
                {img.credit}
              </span>
            </button>
          ))}
        </div>

        {!searching && results.length === 0 && (
          <p className="py-8 text-center text-xs text-white/40">
            Recherchez un mot-clé pour trouver une image libre de droits.
          </p>
        )}
      </div>
    </div>
  );
}
