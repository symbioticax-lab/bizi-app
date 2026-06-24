export const CITIES = [
  {
    slug: "nyc",
    name: "New York City",
    from: "#1e293b",
    to: "#312e81",
    textColor: "#c7d2fe",
    photo: "https://images.unsplash.com/photo-1764782979306-1e489462d895?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    from: "#7c2d12",
    to: "#c2410c",
    textColor: "#fed7aa",
    photo: "https://images.unsplash.com/flagged/photo-1577912504896-abc46b500434?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "miami",
    name: "Miami",
    from: "#134e4a",
    to: "#0891b2",
    textColor: "#a5f3fc",
    photo: "https://images.unsplash.com/photo-1754269675202-6fb0016d9f21?auto=format&fit=crop&w=800&q=80",
  },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];

export const CITY_SLUGS = CITIES.map((c) => c.slug) as unknown as [CitySlug, ...CitySlug[]];

export function getCityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug) ?? null;
}

export const TRIP_PURPOSES = [
  { value: "travel",  label: "Travel" },
  { value: "work",    label: "Work" },
  { value: "shoot",   label: "Shoot" },
  { value: "event",   label: "Event" },
  { value: "leisure", label: "Leisure" },
] as const;

export type TripPurpose = (typeof TRIP_PURPOSES)[number]["value"];

export const TRIP_OPPORTUNITY_TYPES = [
  { value: "offer-services",   label: "Offer My Services",        badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "need-help",        label: "Need Creative Help",       badgeClass: "bg-primary/20 text-primary border-primary/30" },
  { value: "trade-skills",     label: "Trade Skills / Resources", badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "post-opportunity", label: "Post Opportunity",         badgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { value: "share-resources",  label: "Share Studio / Resources", badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
] as const;

export type TripOpportunityType = (typeof TRIP_OPPORTUNITY_TYPES)[number]["value"];

export const TRIP_OPPORTUNITY_TYPE_VALUES = TRIP_OPPORTUNITY_TYPES.map((t) => t.value) as unknown as [TripOpportunityType, ...TripOpportunityType[]];

export function getTripOpportunityType(value: string) {
  return TRIP_OPPORTUNITY_TYPES.find((t) => t.value === value) ?? null;
}

/**
 * Returns a human-readable proximity label when a trip is imminent or active.
 * Returns null when the trip is > 14 days away (show normal date range instead).
 */
export function getTripProximity(begin: string, end: string): string | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const ms = 86_400_000;
  const beginDate = new Date(begin + "T00:00:00");
  const endDate   = new Date(end   + "T00:00:00");
  const daysToStart = Math.round((beginDate.getTime() - now.getTime()) / ms);
  const daysToEnd   = Math.round((endDate.getTime()   - now.getTime()) / ms);

  if (daysToStart > 14) return null;
  if (daysToStart > 1)  return `Arrives in ${daysToStart} days`;
  if (daysToStart === 1) return "Arrives tomorrow";
  if (daysToEnd < 0)    return null;
  if (daysToEnd === 0)  return "Leaving today";
  if (daysToEnd === 1)  return "Leaving tomorrow";
  if (daysToEnd <= 3)   return `Leaving in ${daysToEnd} days`;
  return "Here now";
}
