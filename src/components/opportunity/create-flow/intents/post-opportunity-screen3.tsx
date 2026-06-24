"use client";

import {
  TagChips, DescTextarea, TwoColumnTrade, ContinueButton,
  type Screen3Props,
} from "./wizard-shared";
import { cn } from "@/lib/utils";

const OFFERING_EXAMPLES = [
  "Creative Credit", "Brand Exposure", "Paid Work", "Studio Access",
  "Mentorship", "Photography Session", "Free Product", "Revenue Share",
  "Portfolio Feature", "Collaboration", "Long-term Role",
];

const WANT_EXAMPLES = [
  "Motion Design", "Photography", "Copywriting", "Social Media",
  "Brand Design", "Illustration", "Music", "Development",
  "Video Editing", "Styling", "Consulting",
];

export function PostOpportunityScreen3({ data, patch, onContinue }: Screen3Props) {
  const isOpen = data.wantTags.includes("__open__");
  const canContinue = data.offeringTags.length > 0;

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What's the trade?</h2>
        <p className="text-sm text-white/45">What are you offering, and what skill set should applicants bring?</p>
      </div>

      <TwoColumnTrade
        leftPanel={
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400/70">You're offering</p>
            <TagChips
              label=""
              tags={data.offeringTags}
              onChange={(offeringTags) => patch({ offeringTags })}
              placeholder="e.g. Brand Exposure, Creative Credit…"
              examples={OFFERING_EXAMPLES}
              examplesLabel="Tap to add:"
            />
            <DescTextarea
              value={data.offeringDesc}
              onChange={(offeringDesc) => patch({ offeringDesc })}
              placeholder="Describe what the selected creator receives in detail."
              rows={2}
            />
          </div>
        }
        rightPanel={
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400/70">You're looking for</p>
              <button
                type="button"
                onClick={() => patch({ wantTags: isOpen ? [] : ["__open__"] })}
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                  isOpen
                    ? "border-primary/60 bg-primary/25 text-primary"
                    : "border-white/[0.09] bg-white/[0.04] text-white/40 hover:border-primary/30 hover:text-primary/70",
                )}
              >
                {isOpen ? "✓ Open to all" : "Open to all"}
              </button>
            </div>
            {!isOpen && (
              <>
                <TagChips
                  label=""
                  tags={data.wantTags}
                  onChange={(wantTags) => patch({ wantTags })}
                  placeholder="e.g. Motion Design, Illustration…"
                  examples={WANT_EXAMPLES}
                  examplesLabel="Tap to add:"
                />
                <DescTextarea
                  value={data.wantDesc}
                  onChange={(wantDesc) => patch({ wantDesc })}
                  placeholder="Describe the ideal creator — style, experience level, or vibe."
                  rows={2}
                />
              </>
            )}
            {isOpen && (
              <p className="text-[12px] text-primary/70">
                All creators can apply — you'll evaluate each inquiry as it comes in.
              </p>
            )}
          </div>
        }
      />

      <ContinueButton
        label="Preview opportunity →"
        disabled={!canContinue}
        disabledLabel="Describe what you're offering to continue"
        onClick={onContinue}
      />
    </div>
  );
}
