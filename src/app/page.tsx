"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import InputStep from "@/components/InputStep";
import EditorStep from "@/components/EditorStep";
import type { GenerateRequest, Presentation, Slide } from "@/types/slide";
import type { DraftEntry } from "@/lib/drafts";
import { loadGlobalBrandKit } from "@/lib/brand-kit";

type Step = "input" | "editor";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleGenerate(req: GenerateRequest) {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }
      setPresentation({
        id: uuid(),
        title: data.title,
        themeId: req.themeId,
        language: req.language,
        brandKit: loadGlobalBrandKit(),
        slides: data.slides.map((s: Slide) => ({ ...s, id: s.id || uuid() })),
      });
      setStep("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function handleResumeDraft(draft: DraftEntry) {
    setPresentation(draft.presentation);
    setStep("editor");
  }

  if (step === "editor" && presentation) {
    return (
      <EditorStep
        presentation={presentation}
        onChange={setPresentation}
        onBack={() => {
          setStep("input");
          setPresentation(null);
        }}
      />
    );
  }

  return (
    <InputStep
      onGenerate={handleGenerate}
      loading={loading}
      error={error}
      onResumeDraft={handleResumeDraft}
    />
  );
}
