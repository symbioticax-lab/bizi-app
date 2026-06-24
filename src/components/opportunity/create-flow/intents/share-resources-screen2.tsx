"use client";

import { AlignLeft, MapPin, Images, Clock } from "lucide-react";
import {
  BigDescTextarea, Divider, PaymentSection, SectionLabel,
  LocationInput, ContinueButton,
  type Screen2Props,
} from "./wizard-shared";
import { WizardImageUpload } from "../wizard-image-upload";
import { cn } from "@/lib/utils";

export function ShareResourcesScreen2({ userId, data, patch, onContinue }: Screen2Props) {
  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">What are you sharing?</h2>
        <p className="text-sm text-white/45">Describe the space or gear — photos go a long way here.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <SectionLabel icon={AlignLeft} label="What you're sharing" />
          <BigDescTextarea
            value={data.description}
            onChange={(description) => patch({ description })}
            placeholder="e.g. I have a 600 sq ft photography studio with two seamless backdrops (white and grey), 3-light setup, and a changing room. Available on weekends. Perfect for product photography, headshots, or small music videos."
            hint="Describe it like you'd show it to someone — size, equipment, condition, what it's good for."
          />
        </div>

        <Divider />

        <div className="space-y-3">
          <SectionLabel icon={Images} label="Photos of your space / gear" />
          <WizardImageUpload userId={userId} images={data.imageUrls} onChange={(imageUrls) => patch({ imageUrls })} />
          {data.imageUrls.length === 0 && (
            <p className={cn(
              "rounded-xl border px-3.5 py-2.5 text-[12px]",
              "border-amber-500/20 bg-amber-500/10 text-amber-400/70",
            )}>
              Photos are essential for shared resources — listings without them get significantly fewer responses.
            </p>
          )}
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={Clock} label="When is this available?" />
          <input
            type="text"
            value={data.timeline}
            onChange={(e) => patch({ timeline: e.target.value })}
            placeholder="e.g. Weekends only · Weekdays 9am–6pm · Most evenings"
            className={cn(
              "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
              "px-4 py-3.5 text-[14px] text-white/90 placeholder:text-white/22",
              "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "transition-all duration-150",
            )}
          />
          <p className="text-[11.5px] text-white/25">Be specific — availability is often the deciding factor.</p>
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="Where is this?" />
          <LocationInput
            value={data.location}
            onChange={(location) => patch({ location, locationLat: null, locationLng: null })}
            onSelect={(s) => patch({ location: s.label, locationLat: s.lat, locationLng: s.lng })}
            placeholder="e.g. Brooklyn, NY · East London · Austin, TX"
            hint="Include the neighbourhood if you're comfortable — it helps people find you."
          />
        </div>

        <Divider />

        <PaymentSection
          isPaid={data.isPaid}
          budget={data.budget}
          onIsPaidChange={(isPaid) => patch({ isPaid })}
          onBudgetChange={(budget) => patch({ budget })}
          label="Is there a fee to use this?"
          subLabel="Toggle on to charge money. Leave off to trade access for services."
        />
      </div>

      <ContinueButton label="Next: Access terms →" onClick={onContinue} />
    </div>
  );
}
