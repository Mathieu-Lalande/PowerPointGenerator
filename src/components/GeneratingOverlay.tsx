"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const MESSAGES = [
  "Analyse de votre contenu...",
  "Structuration du plan de slides...",
  "Rédaction des textes...",
  "Choix des couleurs et des icônes...",
  "Mise en page des diapositives...",
  "Dernières retouches...",
];

export default function GeneratingOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card flex flex-col items-center gap-7 px-8 py-14 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/25" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <Sparkles size={26} className="text-accent" />
        </span>
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="space-y-2 rounded-xl border border-border bg-surface-2 p-2.5">
            <div className="h-8 rounded-md bg-white/5" />
            <div className="animate-shimmer h-1.5 w-4/5 rounded-full bg-white/10" />
            <div className="animate-shimmer h-1.5 w-3/5 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      <p key={step} className="animate-slide-enter min-h-[1.25rem] text-sm text-white/60">
        {MESSAGES[step]}
      </p>

      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-2">
        <div className="animate-progress-indeterminate h-full rounded-full bg-accent" />
      </div>
    </div>
  );
}
