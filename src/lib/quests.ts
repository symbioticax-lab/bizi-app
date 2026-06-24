// Quest taxonomy for the onboarding journey on profile pages.
//
// Each quest has a static definition (id, copy, CTA) and a `completedBy` flag
// that's computed server-side from user state. We deliberately don't store
// completion in the DB — single source of truth is the actual data ("did you
// add an avatar?" → look at avatar_url), so completion can never disagree
// with what's really on the profile.

import type { LucideIcon } from "lucide-react";
import {
  Camera, Image as ImageIcon, BookOpen, Sparkles,
  Wand2, Search, Megaphone, Handshake, Trophy, Star,
} from "lucide-react";

export type QuestGroup = "setup" | "show" | "engage";

export type Quest = {
  id: string;
  group: QuestGroup;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Where the user goes when they tap "Do it". Internal href. */
  cta: { label: string; href: string };
};

export const QUESTS: Quest[] = [
  {
    id: "avatar",
    group: "setup",
    title: "Add a profile photo",
    description: "A face makes people 4× more likely to trust your trades.",
    icon: Camera,
    cta: { label: "Upload photo", href: "#avatar" },
  },
  {
    id: "hero",
    group: "setup",
    title: "Set a cover",
    description: "Your magazine cover — first thing visitors see.",
    icon: ImageIcon,
    cta: { label: "Upload cover", href: "#hero" },
  },
  {
    id: "bio",
    group: "setup",
    title: "Write a short bio",
    description: "20+ characters. What you do, what you love.",
    icon: BookOpen,
    cta: { label: "Write bio", href: "/profile/edit" },
  },
  {
    id: "skill",
    group: "setup",
    title: "List a skill",
    description: "Tags help people find you in the right context.",
    icon: Sparkles,
    cta: { label: "Add skills", href: "/profile/edit" },
  },
  {
    id: "offering",
    group: "show",
    title: "Add an offering",
    description: "Something you can do for someone else.",
    icon: Wand2,
    cta: { label: "Add offering", href: "/dashboard" },
  },
  {
    id: "want",
    group: "show",
    title: "Add a want",
    description: "Something you'd love help with in return.",
    icon: Search,
    cta: { label: "Add want", href: "/dashboard" },
  },
  {
    id: "listing",
    group: "show",
    title: "Post your first listing",
    description: "Make a real trade public — that's the engine of BIZI.",
    icon: Megaphone,
    cta: { label: "New listing", href: "/opportunities/new" },
  },
  {
    id: "connection",
    group: "engage",
    title: "Make your first connection",
    description: "Express interest in a listing, or have someone reach out to yours.",
    icon: Handshake,
    cta: { label: "Browse listings", href: "/" },
  },
  {
    id: "trade",
    group: "engage",
    title: "Complete your first trade",
    description: "Both sides marked done. The biggest unlock.",
    icon: Trophy,
    cta: { label: "View negotiations", href: "/negotiations" },
  },
  {
    id: "review",
    group: "engage",
    title: "Earn your first review",
    description: "A peer review is BIZI's currency of trust.",
    icon: Star,
    cta: { label: "View trades", href: "/trades" },
  },
];

export const TOTAL_QUESTS = QUESTS.length;

// -----------------------------------------------------------------------------
// Levels (Starbucks-style tiers driven by quest count)
// -----------------------------------------------------------------------------
export type Level = {
  num: 1 | 2 | 3 | 4;
  name: string;
  /** Inclusive lower bound of completed quests for this level. */
  threshold: number;
  /** What you get for hitting the level — fluffy copy for the UI. */
  perk: string;
};

export const LEVELS: Level[] = [
  { num: 1, name: "New",     threshold: 0,  perk: "Welcome to BIZI" },
  { num: 2, name: "Drafted", threshold: 3,  perk: "Profile feels real" },
  { num: 3, name: "Active",  threshold: 6,  perk: "Visible in Discover" },
  { num: 4, name: "Trusted", threshold: 10, perk: "Verified Trader" },
];

export function levelForCount(completed: number): Level {
  return [...LEVELS].reverse().find((l) => completed >= l.threshold) ?? LEVELS[0];
}

export function nextLevelForCount(completed: number): Level | null {
  return LEVELS.find((l) => l.threshold > completed) ?? null;
}
