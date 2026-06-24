// Flat category taxonomy for the MVP — kept short on purpose so users don't
// drown in choices. Nested taxonomy can come post-MVP once we have data.

export const CATEGORIES = [
  "Design",
  "Development",
  "Writing",
  "Marketing",
  "Photography",
  "Video & Audio",
  "Music",
  "Education & Tutoring",
  "Home & Trades",
  "Business & Consulting",
  "Health & Wellness",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
