"use client";

import {
  TagChips, DescTextarea, WantSection, Divider, ContinueButton,
  type Screen3Props,
} from "./wizard-shared";

const RESOURCE_TAG_EXAMPLES = [
  "Photography Studio", "Recording Studio", "Music Studio", "Video Studio",
  "Art Studio", "Camera Gear", "Lighting Gear", "Production Space",
  "Meeting Room", "Rehearsal Space", "Green Room", "Equipment Rental",
];

const WANT_EXAMPLES = [
  "Photography Work", "Video Work", "Design Work", "Music Production",
  "Social Media Content", "Skill Trade", "Revenue Share", "Credit + Promotion",
  "Collaboration", "Long-term Partner",
];

export function ShareResourcesScreen3({ data, patch, onContinue }: Screen3Props) {
  const canContinue = data.offeringTags.length > 0;

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">How does access work?</h2>
        <p className="text-sm text-white/45">What do you want in exchange, and what are the terms?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <TagChips
            label="Resource type tags"
            hint="These tags help people find your listing — add what applies."
            tags={data.offeringTags}
            onChange={(offeringTags) => patch({ offeringTags })}
            placeholder="e.g. Photography Studio, Lighting Gear…"
            examples={RESOURCE_TAG_EXAMPLES}
            examplesLabel="Common resource tags — tap to add:"
          />
          <DescTextarea
            value={data.offeringDesc}
            onChange={(offeringDesc) => patch({ offeringDesc })}
            placeholder="Any additional details — capacity, included equipment, access rules."
          />
        </div>

        <Divider />

        <WantSection
          want={data.wantTags}
          wantDesc={data.wantDesc}
          onWantChange={(wantTags) => patch({ wantTags })}
          onWantDescChange={(wantDesc) => patch({ wantDesc })}
          label="In return, I'm looking for…"
          hint='Optional — leave blank or choose "open to anything"'
          examples={WANT_EXAMPLES}
          examplesLabel="Popular access terms — tap to add:"
          descPlaceholder="Describe your ideal arrangement — minimum booking, what you'd love in exchange, or any trade preferences."
        />
      </div>

      <ContinueButton
        label="Preview listing →"
        disabled={!canContinue}
        disabledLabel="Add resource type tags to continue"
        onClick={onContinue}
      />
    </div>
  );
}
