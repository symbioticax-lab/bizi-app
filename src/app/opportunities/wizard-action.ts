"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WizardPayload = {
  intent: string;
  offeringTags: string[];
  offeringDesc: string;
  wantTags: string[];
  wantDesc: string;
  isPaid: boolean;
  budget: string;
  description: string;
  imageUrls: string[];
  timeline: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
};

const KEYWORD_MAP: Array<[string, string]> = [
  ["photography", "Photography"], ["photo", "Photography"], ["studio access", "Photography"],
  ["video", "Video & Audio"], ["audio", "Video & Audio"], ["podcast", "Video & Audio"],
  ["music", "Music"],
  ["design", "Design"], ["branding", "Design"], ["creative direction", "Design"], ["wardrobe", "Design"],
  ["marketing", "Marketing"], ["content", "Marketing"],
  ["writing", "Writing"], ["copywriting", "Writing"],
  ["web dev", "Development"], ["development", "Development"], ["code", "Development"],
  ["consulting", "Business & Consulting"], ["business", "Business & Consulting"],
  ["health", "Health & Wellness"], ["wellness", "Health & Wellness"],
];

function deriveCategory(tags: string[]): string {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    for (const [kw, cat] of KEYWORD_MAP) {
      if (key.includes(kw)) return cat;
    }
  }
  return "Other";
}

function buildTitle(intent: string, offeringTags: string[], wantTags: string[], isPaid: boolean, isOpen: boolean): string {
  const offer = offeringTags[0] ?? "Creative Services";
  const want  = wantTags[0]    ?? "Collaboration";
  if (isPaid) {
    const paidMap: Record<string, string> = {
      "need-help":       `Looking for ${offer} Creator`,
      "offer-services":  `${offer} Services`,
      "post-opportunity":`${offer} Opportunity`,
      "share-resources": `${offer} for Hire`,
    };
    return paidMap[intent] ?? `${offer} Opportunity`;
  }
  if (isOpen) {
    const openMap: Record<string, string> = {
      "need-help":       `Looking for ${offer} Creator`,
      "offer-services":  `${offer} Available for Projects`,
      "trade-skills":    `Trade: ${offer}`,
      "post-opportunity":`${offer} Opportunity`,
      "share-resources": `${offer} Available to Share`,
    };
    return openMap[intent] ?? `${offer} Opportunity`;
  }
  const map: Record<string, string> = {
    "need-help":       `Looking for ${offer} Creator`,
    "offer-services":  `${offer} Available for Projects`,
    "trade-skills":    `Trade: ${offer} for ${want}`,
    "post-opportunity":`${offer} Opportunity`,
    "share-resources": `${offer} Available to Share`,
  };
  return map[intent] ?? `${offer} Opportunity`;
}

export async function createFromWizard(
  payload: WizardPayload,
): Promise<{ id: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const category      = deriveCategory(payload.offeringTags);
  const isOpenEnded   = payload.wantTags.includes("__open__");
  const cleanWantTags = isOpenEnded ? [] : payload.wantTags;
  const title         = buildTitle(payload.intent, payload.offeringTags, cleanWantTags, payload.isPaid, isOpenEnded);
  const offeringTitle = payload.offeringTags.join(" / ") || "Creative Services";

  // want_title: budget string for paid listings, semantic label otherwise.
  // Only prepend $ when the value is numeric (e.g. "500", "200–800");
  // leave text values like "Negotiable" as-is so the feed card shows them cleanly.
  const rawBudget = payload.budget.replace(/^\$/, "").trim();
  const budgetDisplay = rawBudget
    ? (/^\d/.test(rawBudget) ? `$${rawBudget}` : rawBudget)
    : "Paid";
  const wantTitle = payload.isPaid
    ? budgetDisplay
    : isOpenEnded
    ? "Open to any exchange"
    : (cleanWantTags.join(" / ") || "Collaboration");

  const wantDesc = payload.isPaid
    ? `Budget: ${wantTitle}.`
    : isOpenEnded
    ? "Open to any exchange — make me an offer!"
    : `Looking for ${wantTitle}.`;

  // Use the user's written description when provided; fall back to an auto-generated summary.
  const locationNote  = payload.location ? ` Location: ${payload.location}.` : "";
  const timelineNote  = payload.timeline ? ` Timeline: ${payload.timeline}.` : "";
  const autoSummary   = `Offering ${offeringTitle}. ${wantDesc}${timelineNote}${locationNote}`;
  const description   = payload.description.trim() || autoSummary;

  const baseRow = {
    owner_id:       user.id,
    title,
    description,
    category,
    offering_title: offeringTitle,
    offering_desc:  payload.offeringDesc.trim() || `Offering ${offeringTitle}.`,
    offering_tags:  payload.offeringTags,
    want_title:     wantTitle,
    want_desc:      payload.wantDesc.trim() || wantDesc,
    want_tags:      cleanWantTags,
    image_urls:     payload.imageUrls,
    negotiable:     !payload.isPaid, // paid listings are not typically negotiable
    status:         "active",
  };

  // Optional columns that depend on pending migrations being applied.
  const optionalRow = {
    intent:       payload.intent || "post-opportunity",
    location:     payload.location.trim() || null,
    location_lat: payload.locationLat,
    location_lng: payload.locationLng,
  };

  let { data, error } = await supabase
    .from("opportunities")
    .insert({ ...baseRow, ...optionalRow })
    .select("id")
    .single();

  // Gracefully degrade if a column (intent/location/coords) isn't migrated yet,
  // so post creation never hard-fails on a schema lag.
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ data, error } = await supabase
      .from("opportunities")
      .insert(baseRow)
      .select("id")
      .single());
  }

  if (error || !data) return { error: error?.message ?? "Could not create listing" };

  revalidatePath("/", "layout");
  return { id: data.id };
}
