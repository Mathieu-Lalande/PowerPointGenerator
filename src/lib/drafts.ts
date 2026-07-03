import type { Presentation } from "@/types/slide";

const AUTOSAVE_KEY = "slidecraft:autosave";
const DRAFTS_KEY = "slidecraft:drafts";
const MAX_DRAFTS = 12;

export interface DraftEntry {
  id: string;
  title: string;
  slideCount: number;
  updatedAt: number;
  presentation: Presentation;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readDrafts(): DraftEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<DraftEntry[]>(localStorage.getItem(DRAFTS_KEY)) ?? [];
}

function writeDrafts(drafts: DraftEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  } catch {
    // Storage full/unavailable: autosave is best-effort, fail silently.
  }
}

export function saveAutosave(presentation: Presentation) {
  if (typeof window === "undefined") return;
  const drafts = readDrafts();
  const idx = drafts.findIndex((d) => d.id === presentation.id);
  const entry: DraftEntry = {
    id: presentation.id,
    title: presentation.title || "Sans titre",
    slideCount: presentation.slides.length,
    updatedAt: Date.now(),
    presentation,
  };
  if (idx >= 0) drafts[idx] = entry;
  else drafts.unshift(entry);
  drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  writeDrafts(drafts);
  try {
    localStorage.setItem(AUTOSAVE_KEY, presentation.id);
  } catch {
    // ignore
  }
}

export function loadLastAutosave(): DraftEntry | null {
  if (typeof window === "undefined") return null;
  const lastId = localStorage.getItem(AUTOSAVE_KEY);
  const drafts = readDrafts();
  if (lastId) {
    const match = drafts.find((d) => d.id === lastId);
    if (match) return match;
  }
  return drafts[0] ?? null;
}

export function listDrafts(): DraftEntry[] {
  return readDrafts();
}

export function deleteDraft(id: string) {
  writeDrafts(readDrafts().filter((d) => d.id !== id));
  if (typeof window !== "undefined" && localStorage.getItem(AUTOSAVE_KEY) === id) {
    localStorage.removeItem(AUTOSAVE_KEY);
  }
}
