"use client";

import { useState } from "react";
import { X, ChevronLeft, Sparkles, Star, ArrowLeftRight, Target, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardData } from "@/components/opportunity/create-flow/wizard";
import { WizardImageUpload } from "@/components/opportunity/create-flow/wizard-image-upload";
import {
  BigDescTextarea,
  TagChips,
  DescTextarea,
  WantSection,
  TimelineGrid,
  LocationInput,
  Toggle,
  Divider,
} from "@/components/opportunity/create-flow/intents/wizard-shared";
import { Step4Preview } from "@/components/opportunity/create-flow/step-4-preview";
import { Step5Success } from "@/components/opportunity/create-flow/step-5-success";
import { createFromWizard } from "@/app/opportunities/wizard-action";

// ── Intent definitions ─────────────────────────────────────────────────────────

const INTENTS = [
  {
    id: "need-help",
    label: "Need Help",
    icon: Sparkles,
    chipActive: "bg-primary/25 border-primary/50 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
    descPlaceholder: "Describe your project — what you're building, the vibe, and what you need…",
    descHint: "Be specific so the right creator knows they're a fit.",
    offeringLabel: "Your skills / what you offer in return",
    offeringPlaceholder: "e.g. Photography, Brand Building…",
    offeringExamples: ["Photography", "Brand Strategy", "Content Creation", "Social Media", "Video Editing", "Web Design", "Mentorship", "Equipment"],
    offeringDescPlaceholder: "Tell them what you bring to the collaboration…",
    wantLabel: "What you're looking for",
    wantExamples: ["Web Dev", "Graphic Design", "Video Editing", "Photography", "Copywriting", "Illustration", "Music Production"],
    wantDescPlaceholder: "What kind of creator or skill are you after?",
    timelineFreeText: false,
  },
  {
    id: "offer-services",
    label: "Offer Services",
    icon: Star,
    chipActive: "bg-emerald-500/25 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgb(52_211_153/0.4)]",
    descPlaceholder: "Pitch your services — what you do, your style, and who you work best with…",
    descHint: "3× more responses when you're specific about your specialty.",
    offeringLabel: "My skills & services",
    offeringPlaceholder: "e.g. Logo Design, Video Editing…",
    offeringExamples: ["Photography", "Video Editing", "Brand Design", "Illustration", "Web Dev", "Music Production", "Copywriting", "Social Media"],
    offeringDescPlaceholder: "Describe your packages, process, or specialties…",
    wantLabel: "Ideal client / project type",
    wantExamples: ["Startups", "Musicians", "Fashion Brands", "Creatives", "Events", "Nonprofits"],
    wantDescPlaceholder: "What kind of client or project would be ideal?",
    timelineFreeText: false,
  },
  {
    id: "trade-skills",
    label: "Trade Skills",
    icon: ArrowLeftRight,
    chipActive: "bg-amber-500/25 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgb(245_158_11/0.4)]",
    descPlaceholder: "Give a bit more context — project, timeline, or anything that helps the right person say yes…",
    descHint: "Optional — the tags below tell most of the story.",
    offeringLabel: "I bring",
    offeringPlaceholder: "e.g. Portrait Photography…",
    offeringExamples: ["Photography", "Video Editing", "Brand Design", "Illustration", "Web Dev", "Music Production", "Copywriting", "Studio Space", "Coaching"],
    offeringDescPlaceholder: "Describe your skill — level, what's included, how much time…",
    wantLabel: "I want",
    wantExamples: ["Videography", "Logo Design", "Website", "Headshots", "Copywriting", "Social Media", "Branding", "Music Mix"],
    wantDescPlaceholder: "What exactly do you need? Be as specific as possible…",
    timelineFreeText: false,
  },
  {
    id: "post-opportunity",
    label: "Post Opportunity",
    icon: Target,
    chipActive: "bg-rose-500/25 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgb(244_63_94/0.4)]",
    descPlaceholder: "Describe the opportunity — scope, deliverables, and what success looks like…",
    descHint: "Include the timeline and any specific requirements.",
    offeringLabel: "You're offering",
    offeringPlaceholder: "e.g. Photography Opportunity, Paid Shoot…",
    offeringExamples: ["Photography", "Video Production", "Design Work", "Music", "Writing", "Illustration", "Development"],
    offeringDescPlaceholder: "What does the creator get out of this?",
    wantLabel: "You're looking for",
    wantExamples: ["Photographer", "Videographer", "Designer", "Writer", "Illustrator", "Developer", "Musician"],
    wantDescPlaceholder: "What type of creator or skill are you looking for?",
    timelineFreeText: false,
  },
  {
    id: "share-resources",
    label: "Share Resources",
    icon: Building2,
    chipActive: "bg-blue-500/25 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgb(59_130_246/0.4)]",
    descPlaceholder: "Describe what you're sharing — capacity, gear, rules, or special features…",
    descHint: "Photos make a huge difference for resources — add some above.",
    offeringLabel: "Resource type",
    offeringPlaceholder: "e.g. Studio, Camera Gear, Co-working Space…",
    offeringExamples: ["Photography Studio", "Recording Studio", "Camera Gear", "Co-working Space", "Event Space", "Music Equipment", "Lighting Kit"],
    offeringDescPlaceholder: "Capacity, access rules, equipment included…",
    wantLabel: "In return, I'm looking for",
    wantExamples: ["Photography", "Video Editing", "Brand Design", "Trade", "Collaboration", "Mentorship"],
    wantDescPlaceholder: "What ideal arrangement or trade are you open to?",
    timelineFreeText: true,
  },
] as const;

const PAYMENT_LABELS: Record<string, { label: string; sub: string }> = {
  "need-help":        { label: "Are you paying for this?",   sub: "Toggle on if you're offering payment to the creator." },
  "offer-services":   { label: "Do you charge a fee?",       sub: "Toggle on if you charge for your services." },
  "trade-skills":     { label: "Is money part of the deal?", sub: "Toggle on if there's a monetary component alongside the trade." },
  "post-opportunity": { label: "Is there a fee or stipend?", sub: "Toggle on if this opportunity involves payment." },
  "share-resources":  { label: "Is there a rental fee?",     sub: "Toggle on if you charge for access to your space or gear." },
};

const ALTERNATIVE_EXAMPLES = [
  "Mentorship", "A course", "Spanish lessons", "Advice session",
  "Photography", "Web design", "Cooking lessons", "Yoga sessions",
  "Music lessons", "Business coaching", "Social media posts",
  "Copywriting", "Personal training", "Accounting help",
];

const INITIAL: WizardData = {
  intent: "",
  offeringTags: [],
  offeringDesc: "",
  wantTags: [],
  wantDesc: "",
  isPaid: false,
  budget: "",
  description: "",
  imageUrls: [],
  timeline: "",
  location: "",
  locationLat: null,
  locationLng: null,
};

// ── SinglePageForm ─────────────────────────────────────────────────────────────

type Props = { userId: string; cancelHref?: string };

export function SinglePageForm({ userId, cancelHref = "/" }: Props) {
  const [data, setData] = useState<WizardData>(INITIAL);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [createdId, setCreatedId] = useState<string | null>(null);

  function patch(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  const intentMeta = INTENTS.find((i) => i.id === data.intent) ?? null;
  const canPreview = Boolean(data.intent) && data.offeringTags.length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError(undefined);
    const result = await createFromWizard(data);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setCreatedId(result.id);
    }
  }

  const navBtnClass =
    "flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white";

  // ── Success ─────────────────────────────────────────────────────────────────
  if (createdId) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(230,22%,4%)]">
        <div className="flex shrink-0 justify-end px-5 pb-3 pt-4">
          <a href={cancelHref} aria-label="Close" className={navBtnClass}>
            <X className="size-4" />
          </a>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-lg">
            <Step5Success opportunityId={createdId} intent={data.intent} />
          </div>
        </div>
      </div>
    );
  }

  // ── Preview ─────────────────────────────────────────────────────────────────
  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(230,22%,4%)]">
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <button onClick={() => setShowPreview(false)} aria-label="Go back" className={navBtnClass}>
            <ChevronLeft className="size-5" />
          </button>
          <a href={cancelHref} aria-label="Close" className={navBtnClass}>
            <X className="size-4" />
          </a>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-lg">
            <Step4Preview
              data={data}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(230,22%,4%)]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
        <a href={cancelHref} aria-label="Back" className={navBtnClass}>
          <ChevronLeft className="size-5" />
        </a>
        <p className="text-[15px] font-semibold text-white/80">List an item</p>
        <a href={cancelHref} aria-label="Close" className={navBtnClass}>
          <X className="size-4" />
        </a>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg space-y-7 px-4 py-5 pb-10">

          {/* Photos */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Photos</p>
            <WizardImageUpload
              userId={userId}
              images={data.imageUrls}
              onChange={(imageUrls) => patch({ imageUrls })}
            />
          </section>

          <Divider />

          {/* Listing type */}
          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Listing type</p>
              <p className="mt-0.5 text-[12px] text-white/28">Choose the type that best describes what you're posting.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {INTENTS.map(({ id, label, icon: Icon, chipActive }) => {
                const active = data.intent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ intent: id })}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium",
                      "transition-all duration-150",
                      active
                        ? chipActive
                        : "border-white/[0.09] bg-white/[0.03] text-white/45 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white/70",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* Description */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Description</p>
            <BigDescTextarea
              value={data.description}
              onChange={(description) => patch({ description })}
              placeholder={intentMeta?.descPlaceholder ?? "Describe what you're posting…"}
              hint={intentMeta?.descHint}
            />
          </section>

          <Divider />

          {/* Offering */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
              {intentMeta?.offeringLabel ?? "What you're offering"}
            </p>
            <TagChips
              label=""
              tags={data.offeringTags}
              onChange={(offeringTags) => patch({ offeringTags })}
              placeholder={intentMeta?.offeringPlaceholder ?? "e.g. Photography, Design…"}
              examples={intentMeta ? [...intentMeta.offeringExamples] : []}
              examplesLabel="Tap to add:"
            />
            <DescTextarea
              value={data.offeringDesc}
              onChange={(offeringDesc) => patch({ offeringDesc })}
              placeholder={intentMeta?.offeringDescPlaceholder ?? "Add more details…"}
            />
          </section>

          <Divider />

          {/* Pricing & Exchange */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Pricing & Exchange</p>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-semibold text-white/85">
                  {PAYMENT_LABELS[data.intent]?.label ?? "Does this involve payment?"}
                </p>
                <p className="mt-0.5 text-[12px] text-white/35">
                  {PAYMENT_LABELS[data.intent]?.sub ?? "Toggle on if money is part of the deal."}
                </p>
              </div>
              <Toggle
                on={data.isPaid}
                onToggle={() => patch({ isPaid: !data.isPaid, wantTags: [], wantDesc: "" })}
                label="Monetary exchange"
              />
            </div>

            {data.isPaid ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Your rate</p>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={data.budget}
                      onChange={(e) => patch({ budget: e.target.value })}
                      placeholder="e.g. 500, 200–800, Negotiable"
                      className={cn(
                        "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
                        "py-3.5 pl-10 pr-4 text-[14px] text-white/90 placeholder:text-white/22",
                        "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        "transition-all duration-150",
                      )}
                    />
                  </div>
                  <p className="text-[11.5px] text-white/25">
                    Flat rate, range, or "Negotiable" — this shows on your listing.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div>
                    <p className="text-[13.5px] font-semibold text-white/85">Can't afford it? I'd also consider…</p>
                    <p className="mt-1 text-[12px] text-white/35">
                      Not everyone can pay your rate — open the door to creative exchanges. It can be anything: lessons, advice, a skill, a course.
                    </p>
                  </div>
                  <TagChips
                    label=""
                    tags={data.wantTags}
                    onChange={(wantTags) => patch({ wantTags })}
                    placeholder="e.g. Spanish lessons, A course…"
                    examples={ALTERNATIVE_EXAMPLES}
                    examplesLabel="Ideas:"
                  />
                  <DescTextarea
                    value={data.wantDesc}
                    onChange={(wantDesc) => patch({ wantDesc })}
                    placeholder="Happy to barter — DM me and we'll figure something out…"
                  />
                </div>
              </div>
            ) : (
              <WantSection
                want={data.wantTags}
                wantDesc={data.wantDesc}
                onWantChange={(wantTags) => patch({ wantTags })}
                onWantDescChange={(wantDesc) => patch({ wantDesc })}
                label={intentMeta?.wantLabel ?? "What you're looking for"}
                examples={intentMeta ? [...intentMeta.wantExamples] : []}
                examplesLabel="Tap to add:"
                descPlaceholder={intentMeta?.wantDescPlaceholder ?? "Describe what you're looking for…"}
              />
            )}
          </section>

          <Divider />

          {/* Timeline */}
          <section className="space-y-3">
            {intentMeta?.timelineFreeText ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Availability</p>
                <input
                  type="text"
                  value={data.timeline}
                  onChange={(e) => patch({ timeline: e.target.value })}
                  placeholder="e.g. Weekends only, Mon–Fri 9am–5pm…"
                  className={cn(
                    "w-full rounded-xl border border-white/[0.09] bg-white/[0.04]",
                    "px-3.5 py-3 text-[14px] text-white/90 placeholder:text-white/22",
                    "focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all duration-150",
                  )}
                />
              </>
            ) : (
              <TimelineGrid
                value={data.timeline}
                onChange={(timeline) => patch({ timeline })}
                label="Timeline"
              />
            )}
          </section>

          <Divider />

          {/* Location */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/35">Location</p>
            <LocationInput
              value={data.location}
              onChange={(location) => patch({ location })}
              onSelect={(sel) => patch({ location: sel.label, locationLat: sel.lat, locationLng: sel.lng })}
              placeholder="City, neighborhood, or Remote"
              hint="Where are you based or working from?"
            />
          </section>

          <Divider />

          {/* Preview button */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!canPreview}
            className={cn(
              "w-full rounded-2xl py-4 text-[15px] font-semibold transition-all duration-200",
              canPreview
                ? "bg-gradient-to-r from-violet-600 via-primary to-violet-500 text-white shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)] hover:opacity-90 active:scale-[0.98]"
                : "cursor-not-allowed bg-white/[0.06] text-white/25",
            )}
          >
            {canPreview
              ? "Preview listing →"
              : !data.intent
                ? "Select a listing type to continue"
                : "Add what you're offering to preview"}
          </button>

        </div>
      </div>
    </div>
  );
}
