"use client";

import { useState, useRef, type KeyboardEvent, type ReactNode, type ComponentType } from "react";
import { X, ArrowLeftRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardData } from "../wizard";
import { LocationAutocomplete, type LocationSelection } from "@/components/ui/location-autocomplete";

// ── Prop types shared by all intent screens ────────────────────────────────────

export type Screen2Props = {
  userId: string;
  data: WizardData;
  patch: (partial: Partial<WizardData>) => void;
  onContinue: () => void;
};

export type Screen3Props = {
  data: WizardData;
  patch: (partial: Partial<WizardData>) => void;
  onContinue: () => void;
};

// ── Constants ──────────────────────────────────────────────────────────────────

export const TIMELINES = [
  { label: "ASAP",       sub: "Need it now" },
  { label: "This week",  sub: "Within 7 days" },
  { label: "This month", sub: "Within 30 days" },
  { label: "Flexible",   sub: "No rush" },
];

// ── Toggle ─────────────────────────────────────────────────────────────────────

export function Toggle({
  on, onToggle, label,
}: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: on ? "hsl(var(--primary))" : "rgba(255,255,255,0.15)" }}
    >
      <span className={cn(
        "pointer-events-none mt-0.5 inline-block size-5 rounded-full bg-white shadow-md",
        "transform transition duration-200 ease-in-out",
        on ? "translate-x-5" : "translate-x-0.5",
      )} />
    </button>
  );
}

// ── DescTextarea ───────────────────────────────────────────────────────────────

export function DescTextarea({
  value, onChange, placeholder, maxLength = 300, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
  rows?: number;
}) {
  const left = maxLength - value.length;
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= maxLength) onChange(e.target.value); }}
        placeholder={placeholder}
        rows={rows}
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

// ── TagChips ───────────────────────────────────────────────────────────────────

export function TagChips({
  label, hint, tags, onChange, placeholder, examples, examplesLabel,
}: {
  label: string;
  hint?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  examples: string[];
  examplesLabel?: string;
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
          {examplesLabel && <p className="text-[11px] text-white/22">{examplesLabel}</p>}
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

// ── ContinueButton ─────────────────────────────────────────────────────────────

export function ContinueButton({
  label, disabled = false, disabledLabel, onClick,
}: {
  label: string;
  disabled?: boolean;
  disabledLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-auto w-full rounded-2xl py-4 text-[15px] font-semibold transition-all duration-200",
        disabled
          ? "cursor-not-allowed bg-white/[0.06] text-white/25"
          : "bg-gradient-to-r from-violet-600 via-primary to-violet-500 text-white shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)] hover:opacity-90 active:scale-[0.98]",
      )}
    >
      {disabled ? (disabledLabel ?? label) : label}
    </button>
  );
}

// ── SectionLabel ───────────────────────────────────────────────────────────────

export function SectionLabel({
  icon: Icon, label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-white/30" />
      <p className="text-xs font-semibold uppercase tracking-widest text-white/35">{label}</p>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────────

export function Divider() {
  return <div className="h-px bg-white/[0.06]" />;
}

// ── TwoColumnTrade ─────────────────────────────────────────────────────────────

export function TwoColumnTrade({
  leftPanel, rightPanel,
}: { leftPanel: ReactNode; rightPanel: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        {leftPanel}
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <ArrowLeftRight className="size-4 shrink-0 text-white/20" />
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        {rightPanel}
      </div>
    </div>
  );
}

// ── PaymentSection ─────────────────────────────────────────────────────────────

export function PaymentSection({
  isPaid, budget, onIsPaidChange, onBudgetChange, label, subLabel,
}: {
  isPaid: boolean;
  budget: string;
  onIsPaidChange: (v: boolean) => void;
  onBudgetChange: (v: string) => void;
  label?: string;
  subLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-semibold text-white/85">
            {label ?? "Does this involve payment?"}
          </p>
          <p className="mt-0.5 text-[12px] text-white/35">
            {subLabel ?? "Toggle on if you're paying or charging a fee."}
          </p>
        </div>
        <Toggle on={isPaid} onToggle={() => onIsPaidChange(!isPaid)} label="Monetary exchange" />
      </div>
      {isPaid && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
              placeholder="e.g. 500, 200–800, Negotiable"
              className={cn(
                "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
                "py-3.5 pl-10 pr-4 text-[14px] text-white/90 placeholder:text-white/22",
                "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
                "transition-all duration-150",
              )}
            />
          </div>
          <p className="text-[11.5px] text-white/25">
            Enter a flat rate, range, or write "Negotiable" — this will show on your listing.
          </p>
        </div>
      )}
    </div>
  );
}

// ── WantSection ────────────────────────────────────────────────────────────────

export function WantSection({
  want, wantDesc, onWantChange, onWantDescChange,
  label, hint, examples, examplesLabel, openLabel, descPlaceholder,
}: {
  want: string[];
  wantDesc: string;
  onWantChange: (tags: string[]) => void;
  onWantDescChange: (v: string) => void;
  label: string;
  hint?: string;
  examples: string[];
  examplesLabel: string;
  openLabel?: string;
  descPlaceholder: string;
}) {
  const isOpen = want.includes("__open__");
  const btnText = openLabel ?? "Open to anything";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/35">{label}</p>
          {hint && <p className="mt-0.5 text-[12px] text-white/30">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => onWantChange(isOpen ? [] : ["__open__"])}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
            isOpen
              ? "border-primary/60 bg-primary/25 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.5),inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
              : "border-white/[0.09] bg-white/[0.04] text-white/40 hover:border-primary/30 hover:bg-primary/10 hover:text-primary/70",
          )}
        >
          {isOpen ? `✓ ${btnText}` : btnText}
        </button>
      </div>
      {!isOpen && (
        <>
          <TagChips
            label=""
            tags={want}
            onChange={onWantChange}
            placeholder="e.g. Collaboration, Design…"
            examples={examples}
            examplesLabel={examplesLabel}
          />
          <DescTextarea
            value={wantDesc}
            onChange={onWantDescChange}
            placeholder={descPlaceholder}
          />
        </>
      )}
      {isOpen && (
        <p className="text-[12px] text-primary/70">
          Your listing will show "Open to any exchange" — interested creators can propose whatever works for them.
        </p>
      )}
    </div>
  );
}

// ── TimelineGrid ───────────────────────────────────────────────────────────────

export function TimelineGrid({
  value, onChange, label,
}: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest text-white/35">{label}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {TIMELINES.map(({ label: tl, sub }) => (
          <button
            key={tl}
            type="button"
            onClick={() => onChange(tl)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3",
              "transition-all duration-150",
              value === tl
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-white/[0.04] border-white/[0.08] text-white/55 hover:bg-white/[0.07] hover:text-white/80",
            )}
          >
            <span className="text-[13px] font-semibold leading-none">{tl}</span>
            <span className={cn(
              "mt-0.5 text-[10.5px] leading-none",
              value === tl ? "text-primary/60" : "text-white/25",
            )}>
              {sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── LocationInput ──────────────────────────────────────────────────────────────

export function LocationInput({
  value, onChange, onSelect, placeholder, hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (sel: LocationSelection) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <LocationAutocomplete
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={placeholder}
      hint={hint}
    />
  );
}

// ── BigDescTextarea ────────────────────────────────────────────────────────────
// The large 600-char description textarea used on Screen 2 for most intents.

export function BigDescTextarea({
  value, onChange, placeholder, hint, exampleHint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  exampleHint?: string;
}) {
  const MAX = 600;
  const left = MAX - value.length;
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= MAX) onChange(e.target.value); }}
        placeholder={placeholder}
        rows={5}
        className={cn(
          "w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04]",
          "px-4 py-3.5 text-[14px] leading-relaxed text-white/90 placeholder:text-white/22",
          "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
          "transition-all duration-150",
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] text-white/25">{hint ?? exampleHint ?? ""}</p>
        <span className={cn(
          "shrink-0 text-[11px] tabular-nums",
          left < 60 ? "text-amber-400/70" : "text-white/20",
        )}>
          {left}
        </span>
      </div>
    </div>
  );
}
