"use client";

import { AlignLeft, Clock, MapPin, Images } from "lucide-react";
import {
  BigDescTextarea, Divider, PaymentSection, SectionLabel,
  TimelineGrid, LocationInput, ContinueButton,
  type Screen2Props,
} from "./wizard-shared";
import { WizardImageUpload } from "../wizard-image-upload";

export function OfferServicesScreen2({ userId, data, patch, onContinue }: Screen2Props) {
  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">Show what you do</h2>
        <p className="text-sm text-white/45">This is your pitch — make it impossible to scroll past.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionLabel icon={AlignLeft} label="My offering" />
          <BigDescTextarea
            value={data.description}
            onChange={(description) => patch({ description })}
            placeholder="e.g. I'm a brand designer with 6 years of experience. I specialise in visual identities for music artists and creative studios. Every project gets a full brand kit — logo, type, colour, and social templates."
            hint="Write in first person. What's your specialty? What do clients get? What makes your work different?"
          />
        </div>

        <Divider />

        <div className="space-y-3">
          <SectionLabel icon={Images} label="Portfolio photos" />
          <p className="text-[11.5px] text-white/30">
            Listings with photos get 3× more responses — add your best work.
          </p>
          <WizardImageUpload userId={userId} images={data.imageUrls} onChange={(imageUrls) => patch({ imageUrls })} />
          {data.imageUrls.length === 0 && (
            <p className="text-[11.5px] text-amber-400/50">
              Tip: a single strong photo turns browsers into inquirers.
            </p>
          )}
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={Clock} label="When are you available?" />
          <TimelineGrid
            value={data.timeline}
            onChange={(timeline) => patch({ timeline })}
            label=""
          />
        </div>

        <Divider />

        <div className="space-y-4">
          <div className="space-y-2">
            <SectionLabel icon={MapPin} label="Location" />
            <LocationInput
              value={data.location}
              onChange={(location) => patch({ location, locationLat: null, locationLng: null })}
              onSelect={(s) => patch({ location: s.label, locationLat: s.lat, locationLng: s.lng })}
              placeholder="e.g. Los Angeles · London · Remote"
              hint='Type "Remote" if you work with anyone, anywhere.'
            />
          </div>
          <PaymentSection
            isPaid={data.isPaid}
            budget={data.budget}
            onIsPaidChange={(isPaid) => patch({ isPaid })}
            onBudgetChange={(budget) => patch({ budget })}
            label="Do you charge a fee?"
            subLabel="Toggle on if you're available for paid work too."
          />
        </div>
      </div>

      <ContinueButton label="Next: Define the exchange →" onClick={onContinue} />
    </div>
  );
}
