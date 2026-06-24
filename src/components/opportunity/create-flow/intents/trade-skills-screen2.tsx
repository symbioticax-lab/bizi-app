"use client";

import { Images } from "lucide-react";
import {
  TagChips, DescTextarea, TwoColumnTrade, ContinueButton, Divider, SectionLabel,
  type Screen2Props,
} from "./wizard-shared";
import { WizardImageUpload } from "../wizard-image-upload";
import { cn } from "@/lib/utils";

const GIVING_EXAMPLES = [
  "Photography", "Video Editing", "Brand Design", "Illustration",
  "Web Dev", "Music Production", "Copywriting", "Social Media",
  "Mentorship", "Equipment", "Studio Space", "Coaching",
];

const WANT_EXAMPLES = [
  "Videography", "Logo Design", "Website", "Headshots",
  "Copywriting", "Social Media", "Branding", "Music Mix",
  "Styling", "Coaching", "Photography", "Illustration",
];

export function TradeSkillsScreen2({ userId, data, patch, onContinue }: Screen2Props) {
  const isOpen = data.wantTags.includes("__open__");
  const canContinue = data.offeringTags.length > 0 && (isOpen || data.wantTags.length > 0);

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What are you trading?</h2>
        <p className="text-sm text-white/45">Put both sides on the table — your skill and what you want back.</p>
      </div>

      <TwoColumnTrade
        leftPanel={
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400/70">I bring</p>
            <TagChips
              label=""
              tags={data.offeringTags}
              onChange={(offeringTags) => patch({ offeringTags })}
              placeholder="e.g. Portrait Photography"
              examples={GIVING_EXAMPLES}
              examplesLabel="Tap to add:"
            />
            <DescTextarea
              value={data.offeringDesc}
              onChange={(offeringDesc) => patch({ offeringDesc })}
              placeholder="Describe your skill — level, what's included, how much time."
              rows={2}
            />
          </div>
        }
        rightPanel={
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400/70">I want</p>
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
                {isOpen ? "✓ Open" : "Open to anything"}
              </button>
            </div>
            {!isOpen && (
              <>
                <TagChips
                  label=""
                  tags={data.wantTags}
                  onChange={(wantTags) => patch({ wantTags })}
                  placeholder="e.g. Logo Design"
                  examples={WANT_EXAMPLES}
                  examplesLabel="Tap to add:"
                />
                <DescTextarea
                  value={data.wantDesc}
                  onChange={(wantDesc) => patch({ wantDesc })}
                  placeholder="What exactly do you need? Be as specific as possible."
                  rows={2}
                />
              </>
            )}
            {isOpen && (
              <p className="text-[12px] text-primary/70">
                Open to proposals — let the right person make an offer.
              </p>
            )}
          </div>
        }
      />

      <Divider />

      <div className="space-y-3">
        <SectionLabel icon={Images} label="Cover photo" />
        <WizardImageUpload userId={userId} images={data.imageUrls} onChange={(imageUrls) => patch({ imageUrls })} />
        {data.imageUrls.length === 0 && (
          <p className="text-[11.5px] text-white/22">
            Optional — show what you're bringing to the table.
          </p>
        )}
      </div>

      <ContinueButton
        label="Next: Add the details →"
        disabled={!canContinue}
        disabledLabel="Add at least one skill on each side to continue"
        onClick={onContinue}
      />
    </div>
  );
}
