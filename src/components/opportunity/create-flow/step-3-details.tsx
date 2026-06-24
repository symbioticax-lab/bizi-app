"use client";

import { AlignLeft, Clock, MapPin, Images, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardImageUpload } from "./wizard-image-upload";

const TIMELINES = [
  { label: "ASAP",       sub: "Need it now" },
  { label: "This week",  sub: "Within 7 days" },
  { label: "This month", sub: "Within 30 days" },
  { label: "Flexible",   sub: "No rush" },
];

const MAX_DESC = 600;

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
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

type Props = {
  userId: string;
  isPaid: boolean;
  budget: string;
  description: string;
  images: string[];
  timeline: string;
  location: string;
  onIsPaidChange: (v: boolean) => void;
  onBudgetChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onImagesChange: (urls: string[]) => void;
  onTimelineChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onContinue: () => void;
};

export function Step3Details({
  userId, isPaid, budget, description, images, timeline, location,
  onIsPaidChange, onBudgetChange, onDescriptionChange,
  onImagesChange, onTimelineChange, onLocationChange, onContinue,
}: Props) {
  const charsLeft = MAX_DESC - description.length;

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">Tell the story</h2>
        <p className="text-sm text-white/45">Give creators the context they need to say yes.</p>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlignLeft className="size-3.5 text-white/30" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Description</p>
          </div>
          <textarea
            value={description}
            onChange={(e) => { if (e.target.value.length <= MAX_DESC) onDescriptionChange(e.target.value); }}
            placeholder="Describe what this opportunity is, who it's for, and what makes it exciting. The more specific you are, the better the fit."
            rows={5}
            className={cn(
              "w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04]",
              "px-4 py-3.5 text-[14px] leading-relaxed text-white/90 placeholder:text-white/22",
              "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "transition-all duration-150",
            )}
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11.5px] text-white/25">
              e.g. "Fashion photographer looking for a model in NYC — you'll receive 20+ edited images."
            </p>
            <span className={cn(
              "shrink-0 text-[11px] tabular-nums",
              charsLeft < 60 ? "text-amber-400/70" : "text-white/20",
            )}>
              {charsLeft}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Payment toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-semibold text-white/85">Does this involve payment?</p>
              <p className="mt-0.5 text-[12px] text-white/35">Toggle on if you're paying or charging a fee.</p>
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

        <div className="h-px bg-white/[0.06]" />

        {/* Photos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Images className="size-3.5 text-white/30" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Photos</p>
          </div>
          <WizardImageUpload userId={userId} images={images} onChange={onImagesChange} />
          {images.length === 0 && (
            <p className="text-[11.5px] text-white/22">
              Photos get 3× more responses — even a quick shot of your work goes a long way.
            </p>
          )}
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-white/30" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
              When do you need this?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIMELINES.map(({ label, sub }) => (
              <button
                key={label}
                type="button"
                onClick={() => onTimelineChange(label)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3",
                  "transition-all duration-150",
                  timeline === label
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-white/[0.04] border-white/[0.08] text-white/55 hover:bg-white/[0.07] hover:text-white/80",
                )}
              >
                <span className="text-[13px] font-semibold leading-none">{label}</span>
                <span className={cn(
                  "mt-0.5 text-[10.5px] leading-none",
                  timeline === label ? "text-primary/60" : "text-white/25",
                )}>{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-white/30" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Location</p>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. New York, NY · Los Angeles · Remote"
            className={cn(
              "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
              "px-4 py-3.5 text-[14px] text-white/90 placeholder:text-white/22",
              "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "transition-all duration-150",
            )}
          />
          <p className="text-[11.5px] text-white/25">
            Type "Remote" if location doesn't matter — creators worldwide can reach out.
          </p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className={cn(
          "mt-auto w-full rounded-2xl py-4",
          "text-[15px] font-semibold text-white",
          "bg-gradient-to-r from-violet-600 via-primary to-violet-500",
          "shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]",
          "transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
        )}
      >
        Continue →
      </button>
    </div>
  );
}
