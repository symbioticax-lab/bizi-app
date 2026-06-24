"use client";

import { AlignLeft, Clock, MapPin, Images } from "lucide-react";
import {
  BigDescTextarea, Divider, PaymentSection, SectionLabel,
  TimelineGrid, LocationInput, ContinueButton,
  type Screen2Props,
} from "./wizard-shared";
import { WizardImageUpload } from "../wizard-image-upload";

export function NeedHelpScreen2({ userId, data, patch, onContinue }: Screen2Props) {
  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What do you need help with?</h2>
        <p className="text-sm text-white/45">Describe your project — the more specific, the better the match.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionLabel icon={AlignLeft} label="Your project" />
          <BigDescTextarea
            value={data.description}
            onChange={(description) => patch({ description })}
            placeholder="e.g. I'm shooting a short film next month and need an experienced gaffer for 2 days. Full creative credit plus my video editing services in return."
            hint="Paint the picture — what's the project, what stage is it at, and what's the vibe?"
          />
        </div>

        <Divider />

        <div className="space-y-3">
          <SectionLabel icon={Images} label="Cover photo" />
          <WizardImageUpload userId={userId} images={data.imageUrls} onChange={(imageUrls) => patch({ imageUrls })} />
          {data.imageUrls.length === 0 && (
            <p className="text-[11.5px] text-white/22">
              Optional — a mood board or project reference helps creators understand what you're going for.
            </p>
          )}
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={Clock} label="When do you need this?" />
          <TimelineGrid
            value={data.timeline}
            onChange={(timeline) => patch({ timeline })}
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="Where?" />
          <LocationInput
            value={data.location}
            onChange={(location) => patch({ location, locationLat: null, locationLng: null })}
            onSelect={(s) => patch({ location: s.label, locationLat: s.lat, locationLng: s.lng })}
            placeholder="e.g. New York, NY · Remote · Anywhere"
            hint={`Add "Remote" if distance doesn't matter.`}
          />
        </div>

        <Divider />

        <PaymentSection
          isPaid={data.isPaid}
          budget={data.budget}
          onIsPaidChange={(isPaid) => patch({ isPaid })}
          onBudgetChange={(budget) => patch({ budget })}
          label="Are you paying for this?"
          subLabel="Toggle on if you're offering money in addition to a trade."
        />
      </div>

      <ContinueButton label="Next: Define the trade →" onClick={onContinue} />
    </div>
  );
}
