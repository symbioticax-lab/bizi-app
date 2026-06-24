"use client";

import { useState } from "react";
import { AlignLeft, Clock, MapPin, Images } from "lucide-react";
import {
  BigDescTextarea, Divider, PaymentSection, SectionLabel,
  TimelineGrid, LocationInput, ContinueButton,
  type Screen2Props,
} from "./wizard-shared";
import { WizardImageUpload } from "../wizard-image-upload";
import { cn } from "@/lib/utils";

export function PostOpportunityScreen2({ userId, data, patch, onContinue }: Screen2Props) {
  const [photosExpanded, setPhotosExpanded] = useState(data.imageUrls.length > 0);

  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">Describe the opportunity</h2>
        <p className="text-sm text-white/45">Give creators what they need to decide if they're the right fit.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionLabel icon={AlignLeft} label="The brief" />
          <BigDescTextarea
            value={data.description}
            onChange={(description) => patch({ description })}
            placeholder="e.g. Seeking a motion designer for a 30-second product ad. You'll receive a credit, exposure to our 50k+ audience, and your choice of our services — photography or strategy consulting."
            hint="Who is this for? What's the scope? What does the selected creator receive?"
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={Clock} label="Project timeline" />
          <TimelineGrid
            value={data.timeline}
            onChange={(timeline) => patch({ timeline })}
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="Location" />
          <LocationInput
            value={data.location}
            onChange={(location) => patch({ location, locationLat: null, locationLng: null })}
            onSelect={(s) => patch({ location: s.label, locationLat: s.lat, locationLng: s.lng })}
            placeholder="e.g. London · Remote OK · On-site in Berlin"
          />
        </div>

        <Divider />

        <PaymentSection
          isPaid={data.isPaid}
          budget={data.budget}
          onIsPaidChange={(isPaid) => patch({ isPaid })}
          onBudgetChange={(budget) => patch({ budget })}
          label="Is there a fee or stipend?"
          subLabel="Toggle on if you're paying for this work."
        />

        <Divider />

        {/* Collapsed photo uploader */}
        <div className="space-y-3">
          <SectionLabel icon={Images} label="Reference image" />
          {!photosExpanded ? (
            <button
              type="button"
              onClick={() => setPhotosExpanded(true)}
              className={cn(
                "w-full rounded-xl border border-dashed border-white/[0.09] bg-white/[0.02]",
                "py-4 text-[13px] text-white/30 transition-all duration-150",
                "hover:border-white/[0.16] hover:text-white/50",
              )}
            >
              + Add a reference image to help creators understand the visual direction
            </button>
          ) : (
            <WizardImageUpload userId={userId} images={data.imageUrls} onChange={(imageUrls) => patch({ imageUrls })} />
          )}
        </div>
      </div>

      <ContinueButton label="Next: Define the exchange →" onClick={onContinue} />
    </div>
  );
}
