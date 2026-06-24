"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const OFFERING_EXAMPLES = [
  "Photography", "Video Editing", "Brand Design", "Illustration",
  "Studio Time", "Social Media", "Copywriting", "Web Dev",
  "Music Production", "Wardrobe Styling", "Equipment", "Makeup",
];

const WANT_EXAMPLES = [
  "Collaboration", "Content Creation", "Brand Exposure", "Paid Work",
  "Skill Trade", "Cross-promotion", "Networking", "Partnership",
  "Mentorship", "Product in Exchange",
];

const MAX_DESC = 300;

// ── Inline description textarea ────────────────────────────────────────────────

function DescTextarea({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const left = MAX_DESC - value.length;
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= MAX_DESC) onChange(e.target.value); }}
        placeholder={placeholder}
        rows={3}
        className={cn(
          "w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04]",
          "px-3.5 py-3 text-[13px] leading-relaxed text-white/85 placeholder:text-white/20",
          "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15",
          "transition-all duration-150",
        )}
      />
      <p className={cn(
        "text-right text-[11px] tabular-nums",
        left < 60 ? "text-amber-400/60" : "text-white/18",
      )}>
        {left}
      </p>
    </div>
  );
}

// ── Tag input ──────────────────────────────────────────────────────────────────

function TagInput({ label, hint, tags, onChange, placeholder, examples, examplesLabel }: {
  label: string;
  hint: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  examples: string[];
  examplesLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const val = raw.trim().replace(/,+$/, "").trim();
    if (!val || tags.map((t) => t.toLowerCase()).includes(val.toLowerCase())) {
      setDraft(""); return;
    }
    onChange([...tags, val]);
    setDraft("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(draft); }
    else if (e.key === "Backspace" && draft === "" && tags.length > 0) onChange(tags.slice(0, -1));
  }

  const visible = examples
    .filter((ex) => !tags.map((t) => t.toLowerCase()).includes(ex.toLowerCase()))
    .slice(0, 10);

  return (
    <div className="space-y-2.5">
      {(label || hint) && (
        <div>
          {label && <p className="text-xs font-semibold uppercase tracking-widest text-white/35">{label}</p>}
          {hint  && <p className="mt-0.5 text-[12px] text-white/30">{hint}</p>}
        </div>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[52px] cursor-text flex-wrap items-center gap-1.5 rounded-xl",
          "border border-white/[0.09] bg-white/[0.04] px-3 py-2.5",
          "transition-all duration-150",
          "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15",
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/20 px-2.5 py-1 text-[12px] font-medium text-primary shadow-[0_0_8px_hsl(var(--primary)/0.45),inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
              className="ml-0.5 text-primary/50 hover:text-primary transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => commit(draft)}
          placeholder={tags.length === 0 ? placeholder : "Add more…"}
          className="min-w-[130px] flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/22 focus:outline-none"
        />
      </div>

      {draft.trim().length > 0 && (
        <p className="text-[11.5px] text-white/30">
          Press <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to add "{draft.trim()}"
        </p>
      )}

      {visible.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-white/22">{examplesLabel}</p>
          <div className="flex flex-wrap gap-1.5">
            {visible.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { onChange([...tags, ex]); inputRef.current?.focus(); }}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white/35 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white/65"
              >
                + {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step component ─────────────────────────────────────────────────────────────

type Props = {
  intent: string;
  offering: string[];
  offeringDesc: string;
  want: string[];
  wantDesc: string;
  onOfferingChange: (tags: string[]) => void;
  onOfferingDescChange: (v: string) => void;
  onWantChange: (tags: string[]) => void;
  onWantDescChange: (v: string) => void;
  onContinue: () => void;
};

export function Step2Exchange({
  intent, offering, offeringDesc, want, wantDesc,
  onOfferingChange, onOfferingDescChange,
  onWantChange, onWantDescChange,
  onContinue,
}: Props) {
  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">Define the exchange</h2>
        <p className="text-sm text-white/45">
          Add tags for quick discovery, then describe each side of the deal.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Offering ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <TagInput
            label="I'm offering"
            hint="Skills, services, resources, or access you can provide."
            tags={offering}
            onChange={onOfferingChange}
            placeholder="e.g. Portrait Photography…"
            examples={OFFERING_EXAMPLES}
            examplesLabel="Popular offering tags — tap to add:"
          />
          <DescTextarea
            value={offeringDesc}
            onChange={onOfferingDescChange}
            placeholder="Describe your offering in detail — your experience, what's included, and what makes you the right fit."
          />
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* ── I'm looking for ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
                  I'm looking for
                </p>
                <p className="mt-0.5 text-[12px] text-white/30">
                  Optional — leave blank or choose "open to anything"
                </p>
              </div>

              <button
                type="button"
                onClick={() => onWantChange(want.includes("__open__") ? [] : ["__open__"])}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
                  want.includes("__open__")
                    ? "border-primary/60 bg-primary/25 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.5),inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                    : "border-white/[0.09] bg-white/[0.04] text-white/40 hover:border-primary/30 hover:bg-primary/10 hover:text-primary/70",
                )}
              >
                {want.includes("__open__") ? "✓ Open to anything" : "Open to anything"}
              </button>
            </div>

            {!want.includes("__open__") && (
              <TagInput
                label=""
                hint=""
                tags={want}
                onChange={onWantChange}
                placeholder="e.g. Brand Exposure, Collaboration…"
                examples={WANT_EXAMPLES}
                examplesLabel="Popular tags — tap to add:"
              />
            )}

            {want.includes("__open__") && (
              <p className="text-[12px] text-primary/70">
                Your listing will show "Open to any exchange" — interested creators can propose whatever works for them.
              </p>
            )}
          </div>

          {!want.includes("__open__") && (
            <DescTextarea
              value={wantDesc}
              onChange={onWantDescChange}
              placeholder="Describe what kind of collaboration, exchange, or creator you're hoping to connect with."
            />
          )}
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={offering.length === 0}
        className={cn(
          "mt-auto w-full rounded-2xl py-4 text-[15px] font-semibold transition-all duration-200",
          offering.length > 0
            ? "bg-gradient-to-r from-violet-600 via-primary to-violet-500 text-white shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)] hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed bg-white/[0.06] text-white/25",
        )}
      >
        {offering.length === 0 ? "Add at least one offering to continue" : "Preview →"}
      </button>
    </div>
  );
}
