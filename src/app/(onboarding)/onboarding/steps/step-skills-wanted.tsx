"use client";

import { useState, useRef } from "react";
import { Check, Plus, X } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { ContinuePill } from "@/components/onboarding/step-cta";
import { saveSkillsWantedAction } from "../actions";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "headshots", "logo design", "website", "haircut", "videography",
  "branding", "styling", "copywriting", "social media", "tutoring",
  "photography", "editing", "animation", "music production", "makeup",
  "content creation", "coaching", "catering", "tattoo", "graphic design",
];

export function StepSkillsWanted({ defaultValue }: { defaultValue: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function toggle(skill: string) {
    if (tags.includes(skill)) {
      setTags(tags.filter((t) => t !== skill));
    } else if (tags.length < 12) {
      setTags([...tags, skill]);
    }
  }

  function addCustom() {
    const v = custom.trim().toLowerCase();
    if (!v || tags.includes(v) || tags.length >= 12) return;
    setTags([...tags, v]);
    setCustom("");
    inputRef.current?.focus();
  }

  return (
    <form action={saveSkillsWantedAction} className="flex flex-1 flex-col">
      {/* Hidden form inputs — one per selected tag */}
      {tags.map((t) => (
        <input key={t} type="hidden" name="skills_wanted" value={t} />
      ))}

      <StepShell
        step={2}
        total={4}
        backHref="/onboarding?step=2"
        eyebrow="What you need"
        title="What are you looking for?"
        subtitle="Tap anything you'd love to receive. The more specific, the better your matches."
        skipHref="/onboarding?step=4"
        footer={<ContinuePill>Find my matches</ContinuePill>}
      >
        <div className="flex flex-col gap-4">
          {/* Selected items — removable chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
                >
                  {t}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          )}

          {/* Tap-to-select grid */}
          <div className="grid grid-cols-3 gap-2">
            {SUGGESTIONS.map((s) => {
              const selected = tags.includes(s);
              const atCap = !selected && tags.length >= 12;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={atCap}
                  onClick={() => toggle(s)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-1.5 text-[11.5px] font-medium transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-white/[0.09] bg-white/[0.04] text-foreground/60 hover:border-white/20 hover:text-foreground",
                    atCap && "pointer-events-none opacity-35",
                  )}
                >
                  {selected && <Check className="size-3 shrink-0" />}
                  {s}
                </button>
              );
            })}
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Something else? Type it in…"
              maxLength={40}
              disabled={tags.length >= 12}
              className={cn(
                "flex-1 rounded-full border border-white/[0.09] bg-white/[0.04]",
                "px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25",
                "focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20",
                "disabled:opacity-40",
              )}
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!custom.trim() || tags.length >= 12}
              className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {tags.length >= 12 && (
            <p className="text-center text-xs text-muted-foreground">
              Cap reached — 12 max.
            </p>
          )}
        </div>
      </StepShell>
    </form>
  );
}
