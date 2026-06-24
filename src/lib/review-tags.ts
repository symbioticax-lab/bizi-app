// Predefined review tags. Capped at 6 to keep selection fast and prevent spam.
// Stored on reviews.tags as a text[] of these slugs; UI renders the label.

export const REVIEW_TAGS = [
  { id: "professional",        label: "Professional" },
  { id: "great_communicator",  label: "Great communicator" },
  { id: "delivered_fast",      label: "Delivered fast" },
  { id: "exceeded_expectations", label: "Exceeded expectations" },
  { id: "fair_and_clear",      label: "Fair & clear terms" },
  { id: "would_trade_again",   label: "Would trade again" },
] as const;

export type ReviewTagId = (typeof REVIEW_TAGS)[number]["id"];

export const MAX_TAGS = 4;

export function reviewTagLabel(id: string): string {
  return REVIEW_TAGS.find((t) => t.id === id)?.label ?? id;
}
