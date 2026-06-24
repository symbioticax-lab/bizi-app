"use client";

import {
  TagChips, DescTextarea, WantSection, Divider, ContinueButton,
  type Screen3Props,
} from "./wizard-shared";

const SKILL_EXAMPLES = [
  "Photography", "Videography", "Brand Design", "Illustration",
  "Web Dev", "Music Production", "Copywriting", "Social Media",
  "Coaching", "Consulting", "Wardrobe Styling", "Makeup",
];

const WANT_EXAMPLES = [
  "Collaboration", "Brand Exposure", "Paid Work", "Skill Trade",
  "Startup Projects", "Creative Freedom", "Long-term Partner",
  "Portfolio Piece", "Networking", "Mentorship",
];

export function OfferServicesScreen3({ data, patch, onContinue }: Screen3Props) {
  const canContinue = data.offeringTags.length > 0;

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What are you looking for?</h2>
        <p className="text-sm text-white/45">Name the skills, projects, or clients that excite you.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <TagChips
            label="My skills / services"
            hint="Add specific skills — these appear as discovery tags on your listing."
            tags={data.offeringTags}
            onChange={(offeringTags) => patch({ offeringTags })}
            placeholder="e.g. Portrait Photography, Brand Design…"
            examples={SKILL_EXAMPLES}
            examplesLabel="Popular skill tags — tap to add:"
          />
          <DescTextarea
            value={data.offeringDesc}
            onChange={(offeringDesc) => patch({ offeringDesc })}
            placeholder="Any additional details — packages, deliverables, or availability notes."
          />
        </div>

        <Divider />

        <WantSection
          want={data.wantTags}
          wantDesc={data.wantDesc}
          onWantChange={(wantTags) => patch({ wantTags })}
          onWantDescChange={(wantDesc) => patch({ wantDesc })}
          label="Ideal client or project type"
          hint="Optional — what kind of trade or project gets you excited?"
          examples={WANT_EXAMPLES}
          examplesLabel="Popular tags — tap to add:"
          descPlaceholder="Describe your ideal client, project size, or collaboration style. What's a perfect-fit inquiry for you?"
        />
      </div>

      <ContinueButton
        label="Preview my listing →"
        disabled={!canContinue}
        disabledLabel="Add at least one service to continue"
        onClick={onContinue}
      />
    </div>
  );
}
