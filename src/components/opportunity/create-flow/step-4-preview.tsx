"use client";

import Image from "next/image";
import { ArrowLeftRight, MapPin, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardData } from "./wizard";

type Props = {
  data: WizardData;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
};

function deriveTitle(data: WizardData): string {
  const offer  = data.offeringTags[0] ?? "Creative Services";
  const isOpen = data.wantTags.includes("__open__");
  const want   = isOpen ? "" : (data.wantTags[0] ?? "Collaboration");
  if (isOpen) {
    const openMap: Record<string, string> = {
      "need-help":       `Looking for ${offer} Creator`,
      "offer-services":  `${offer} Available for Projects`,
      "trade-skills":    `Trade: ${offer}`,
      "post-opportunity":`${offer} Opportunity`,
      "share-resources": `${offer} Available to Share`,
    };
    return openMap[data.intent] ?? `${offer} Opportunity`;
  }
  const map: Record<string, string> = {
    "need-help":       `Looking for ${offer} Creator`,
    "offer-services":  `${offer} Available for Projects`,
    "trade-skills":    `Trade: ${offer} for ${want}`,
    "post-opportunity":`${offer} Opportunity`,
    "share-resources": `${offer} Available to Share`,
    "create-event":    `${offer} Event`,
    "start-group":     `${offer} Group / Project`,
  };
  return map[data.intent] ?? `${offer} Opportunity`;
}

const PREVIEW_COPY: Record<string, { headline: string; sub: string; submitLabel: string }> = {
  "need-help":        { headline: "Ready to post?",       sub: "Here's how your request will appear to creators.",       submitLabel: "Post Request ✦" },
  "offer-services":   { headline: "Looking good?",        sub: "This is how your services listing will show up.",         submitLabel: "Publish Services ✦" },
  "trade-skills":     { headline: "Fair trade?",           sub: "Here's how your trade listing will appear.",              submitLabel: "Post Trade ✦" },
  "post-opportunity": { headline: "Ready to broadcast?",  sub: "Here's how the opportunity will appear to creators.",     submitLabel: "Post Opportunity ✦" },
  "share-resources":  { headline: "Ready to share?",      sub: "Here's how your space or gear listing will appear.",      submitLabel: "List Resource ✦" },
};

const INTENT_ACCENT: Record<string, string> = {
  "need-help":        "ring-primary/30 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5),0_2px_20px_-6px_rgb(0_0_0/0.6)]",
  "offer-services":   "ring-emerald-500/30 shadow-[0_0_30px_-8px_rgb(52_211_153/0.5),0_2px_20px_-6px_rgb(0_0_0/0.6)]",
  "trade-skills":     "ring-amber-500/30 shadow-[0_0_30px_-8px_rgb(245_158_11/0.5),0_2px_20px_-6px_rgb(0_0_0/0.6)]",
  "post-opportunity": "ring-rose-500/30 shadow-[0_0_30px_-8px_rgb(244_63_94/0.5),0_2px_20px_-6px_rgb(0_0_0/0.6)]",
  "share-resources":  "ring-blue-500/30 shadow-[0_0_30px_-8px_rgb(59_130_246/0.5),0_2px_20px_-6px_rgb(0_0_0/0.6)]",
};

export function Step4Preview({ data, onSubmit, submitting, error }: Props) {
  const copy         = PREVIEW_COPY[data.intent] ?? PREVIEW_COPY["post-opportunity"];
  const accentClass  = INTENT_ACCENT[data.intent] ?? INTENT_ACCENT["post-opportunity"];
  const title        = deriveTitle(data);
  const isOpen       = data.wantTags.includes("__open__");

  const exchangeLabel = data.isPaid ? "Budget"
    : data.intent === "share-resources" ? "Access terms"
    : data.intent === "post-opportunity" ? "What you get"
    : "Exchange";

  const rawBudget = data.budget.replace(/^\$/, "").trim();
  const exchangeValue = data.isPaid
    ? (rawBudget ? (/^\d/.test(rawBudget) ? `$${rawBudget}` : rawBudget) : "Paid")
    : isOpen
    ? "Open to any exchange"
    : (data.wantTags.join(" / ") || "Collaboration");

  const tags       = data.offeringTags.slice(0, 3);
  const coverImage = data.imageUrls[0] ?? null;
  const today      = new Date();
  const end        = new Date(today);
  end.setDate(end.getDate() + 12);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">{copy.headline}</h2>
        <p className="text-sm text-white/45">{copy.sub}</p>
      </div>

      {/* Preview card — mirrors OpportunityListItem */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl",
          "border border-white/[0.07] bg-[hsl(248,22%,9%)]",
          "ring-1",
          accentClass,
        )}
      >
        <div className="flex min-h-[180px]">
          {/* Left: cover image or gradient fallback */}
          <div className="w-[38%] shrink-0 p-[7px]">
            <div className="relative flex h-full min-h-[160px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-indigo-950">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 38vw, 200px"
                />
              ) : (
                <ArrowLeftRight className="size-6 text-white/20" />
              )}
              <div className="absolute left-2 top-2 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
                  <TrendingUp className="size-2.5" />
                  NEW
                </span>
              </div>
            </div>
          </div>

          {/* Right: content */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-4 pr-4 pl-1">
            <p className="text-[10px] font-bold tracking-widest text-primary">PREVIEW</p>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.3] text-white">
              {title}
              {isOpen && (
                <span className="ml-1.5 inline-flex translate-y-[-1px] items-center rounded-full border border-primary/40 bg-primary/20 px-2 py-px text-[10px] font-bold text-primary">
                  Open
                </span>
              )}
            </h3>
            {!isOpen && (
              <p className="text-[13px] leading-snug">
                <span className="font-semibold text-primary">{exchangeLabel}:</span>{" "}
                <span className="text-white/70">{exchangeValue}</span>
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/65"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2.5 text-[11px] text-white/40">
              <span className="flex items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                {data.location || "Remote"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3 shrink-0" />
                {fmt(today)} – {fmt(end)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className={cn(
          "w-full rounded-2xl py-4",
          "text-[15px] font-semibold tracking-tight",
          "transition-all duration-200",
          submitting
            ? "cursor-not-allowed bg-white/[0.06] text-white/30"
            : "bg-gradient-to-r from-violet-600 via-primary to-violet-500 text-white shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)] hover:opacity-90 active:scale-[0.98]",
        )}
      >
        {submitting ? "Posting…" : copy.submitLabel}
      </button>
    </div>
  );
}
