"use client";

import {
  TagChips, DescTextarea, WantSection, Divider, ContinueButton,
  type Screen3Props,
} from "./wizard-shared";

const OFFERING_EXAMPLES = [
  "Photography", "Video Editing", "Brand Design", "Social Media",
  "Copywriting", "Web Dev", "Music Production", "Mentorship",
  "Equipment", "Studio Time", "Marketing", "Illustration",
];

const WANT_EXAMPLES = [
  "Collaboration", "Content Creation", "Brand Exposure", "Paid Work",
  "Skill Trade", "Cross-promotion", "Networking", "Partnership",
  "Mentorship", "Product in Exchange",
];

export function NeedHelpScreen3({ data, patch, onContinue }: Screen3Props) {
  const canContinue = data.offeringTags.length > 0;

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What do you bring to the table?</h2>
        <p className="text-sm text-white/45">Tell creators what you're offering in return — this is your side of the deal.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <TagChips
            label="Your skills / resources"
            hint="What can you trade? Add the skills, services, or access you'll give in return."
            tags={data.offeringTags}
            onChange={(offeringTags) => patch({ offeringTags })}
            placeholder="e.g. Brand Design, Copywriting…"
            examples={OFFERING_EXAMPLES}
            examplesLabel="Popular offering tags — tap to add:"
          />
          <DescTextarea
            value={data.offeringDesc}
            onChange={(offeringDesc) => patch({ offeringDesc })}
            placeholder="Tell them more about your side of the trade — experience level, what's included, and why it's valuable."
          />
        </div>

        <Divider />

        <WantSection
          want={data.wantTags}
          wantDesc={data.wantDesc}
          onWantChange={(wantTags) => patch({ wantTags })}
          onWantDescChange={(wantDesc) => patch({ wantDesc })}
          label="What would make this a great trade?"
          hint='Optional — leave blank or choose "open to anything"'
          examples={WANT_EXAMPLES}
          examplesLabel="Popular tags — tap to add:"
          descPlaceholder="Describe what kind of creator, skill, or exchange would make this perfect."
        />
      </div>

      <ContinueButton
        label="Preview listing →"
        disabled={!canContinue}
        disabledLabel="Add at least one skill to continue"
        onClick={onContinue}
      />
    </div>
  );
}
