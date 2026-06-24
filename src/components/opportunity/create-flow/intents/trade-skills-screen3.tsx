"use client";

import { AlignLeft, Clock, MapPin } from "lucide-react";
import {
  BigDescTextarea, Divider, SectionLabel,
  TimelineGrid, LocationInput, ContinueButton,
  type Screen3Props,
} from "./wizard-shared";

export function TradeSkillsScreen3({ data, patch, onContinue }: Screen3Props) {
  return (
    <div className="flex flex-col gap-7 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-white">The details</h2>
        <p className="text-sm text-white/45">A bit of context helps the right person say yes fast.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel icon={AlignLeft} label="A bit more context" />
            <span className="text-[11px] text-white/25">(optional)</span>
          </div>
          <BigDescTextarea
            value={data.description}
            onChange={(description) => patch({ description })}
            placeholder="e.g. I'm a photographer with a studio — I want to trade a full portrait session for a 2-page website. Open to remote for the web work."
            hint="Skip it and we'll build one from your tags."
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={Clock} label="When are you ready to swap?" />
          <TimelineGrid
            value={data.timeline}
            onChange={(timeline) => patch({ timeline })}
          />
        </div>

        <Divider />

        <div className="space-y-2">
          <SectionLabel icon={MapPin} label="Where are you based?" />
          <LocationInput
            value={data.location}
            onChange={(location) => patch({ location, locationLat: null, locationLng: null })}
            onSelect={(s) => patch({ location: s.label, locationLat: s.lat, locationLng: s.lng })}
            placeholder="e.g. Los Angeles · Remote · NYC preferred"
            hint="Trades often work better in-person — give people a sense of where you are."
          />
        </div>
      </div>

      <ContinueButton label="Preview the trade →" onClick={onContinue} />
    </div>
  );
}
