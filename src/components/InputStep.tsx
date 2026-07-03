"use client";

import { useState } from "react";
import { Lightbulb, NotebookPen, Users, FileText, Sparkles, Loader2 } from "lucide-react";
import clsx from "clsx";
import ThemeGrid from "@/components/ThemeGrid";
import type { GenerateRequest } from "@/types/slide";

interface Props {
  onGenerate: (req: GenerateRequest) => void;
  loading: boolean;
  error?: string;
}

const KIND_OPTIONS: { id: GenerateRequest["inputKind"]; label: string; icon: any; hint: string }[] = [
  { id: "idea", label: "Idée", icon: Lightbulb, hint: "Un concept à développer" },
  { id: "notes", label: "Notes", icon: NotebookPen, hint: "Notes en vrac" },
  { id: "meeting", label: "Compte-rendu", icon: Users, hint: "Réunion, atelier" },
  { id: "raw", label: "Texte libre", icon: FileText, hint: "Article, document" },
];

const DEFAULT_SOURCE_TEXT = `Je voudrais lancer une application mobile qui aide les gens à réduire leur gaspillage alimentaire. L'idée : l'utilisateur scanne ses courses avec la caméra du téléphone, l'app détecte les dates de péremption et envoie des rappels avant que les produits ne périment. Elle propose aussi des recettes adaptées aux ingrédients qui vont bientôt expirer.

Le modèle économique serait freemium : gratuit avec pubs, ou 4,99€/mois sans pub avec des fonctionnalités avancées (liste de courses intelligente, statistiques d'économies réalisées). Cible principale : familles urbaines de 25-45 ans soucieuses de leur budget et de l'environnement.

Un tiers de la nourriture produite dans le monde est gaspillée chaque année, et une famille française jette en moyenne 30kg de nourriture par an. Le marché des applications anti-gaspi a progressé de 45% en 2024, 60% en 2025 et devrait atteindre +80% en 2026.`;

export default function InputStep({ onGenerate, loading, error }: Props) {
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE_TEXT);
  const [inputKind, setInputKind] = useState<GenerateRequest["inputKind"]>("idea");
  const [themeId, setThemeId] = useState("midnight-tech");
  const [slideCount, setSlideCount] = useState(8);
  const [language, setLanguage] = useState("français");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-white/70">
          <Sparkles size={14} className="text-accent" />
          Génération de slides par IA
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Créez un PowerPoint pro
          <br />
          <span className="text-accent">en quelques secondes</span>
        </h1>
        <p className="mx-auto max-w-xl text-white/60">
          Collez vos idées, vos notes ou un compte-rendu. Choisissez un thème.
          L&apos;IA structure et rédige vos slides, prêtes à exporter en .pptx.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <label className="mb-3 block text-sm font-medium text-white/70">
            Que voulez-vous transformer en présentation ?
          </label>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KIND_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = inputKind === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInputKind(opt.id)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs transition",
                    active
                      ? "border-accent bg-accent/10 text-white"
                      : "border-border text-white/60 hover:border-accent/50"
                  )}
                >
                  <Icon size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Collez vos notes, votre idée ou votre compte-rendu ici..."
            className="input-field h-56 resize-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Nombre de slides</span>
              <input
                type="range"
                min={5}
                max={16}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="accent-accent"
              />
              <span className="w-6 text-center text-xs text-white/70">{slideCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Langue</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-white"
              >
                <option value="français">Français</option>
                <option value="anglais">Anglais</option>
                <option value="espagnol">Espagnol</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={loading || sourceText.trim().length < 10}
            onClick={() =>
              onGenerate({ sourceText, inputKind, themeId, slideCount, language })
            }
            className="btn-primary mt-6 w-full"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Générer ma présentation
              </>
            )}
          </button>
        </div>

        <div className="card p-6">
          <label className="mb-3 block text-sm font-medium text-white/70">
            Choisissez un thème
          </label>
          <ThemeGrid selectedId={themeId} onSelect={setThemeId} />
        </div>
      </div>
    </div>
  );
}
