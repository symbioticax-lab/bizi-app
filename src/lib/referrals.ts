// Referral tier definitions + helpers.
// Designed for early-stage conversion: first referral unlocks an immediate tier
// so referrers feel rewarded right away, then larger gates for power users.

export type ReferralTier = {
  num: 1 | 2 | 3 | 4;
  name: string;
  /** Inclusive lower bound of completed referrals required to be in this tier. */
  threshold: number;
  /** Short headline label shown in UI. */
  perk: string;
  /** Longer descriptor for the tier list. */
  perkDetail: string;
  /** When true, the tier confers a permanent profile badge. */
  hasBadge: boolean;
};

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    num: 1,
    name: "Spreader",
    threshold: 0,
    perk: "Welcome",
    perkDetail: "Share your code to climb the ranks.",
    hasBadge: false,
  },
  {
    num: 2,
    name: "Connector",
    threshold: 1,
    perk: "Custom accent",
    perkDetail: "Profile accent color picker unlocked.",
    hasBadge: true,
  },
  {
    num: 3,
    name: "Trusted Referrer",
    threshold: 5,
    perk: "Featured slot",
    perkDetail: "30 days featured in Discover when the slot opens up + permanent badge.",
    hasBadge: true,
  },
  {
    num: 4,
    name: "Top Connector",
    threshold: 15,
    perk: "Founding status",
    perkDetail: "Permanent founding member status + early access to every new feature.",
    hasBadge: true,
  },
];

export function tierForReferralCount(count: number): ReferralTier {
  return [...REFERRAL_TIERS].reverse().find((t) => count >= t.threshold) ?? REFERRAL_TIERS[0];
}

export function nextTierForReferralCount(count: number): ReferralTier | null {
  return REFERRAL_TIERS.find((t) => t.threshold > count) ?? null;
}

/**
 * Construct the public-facing share URL for a given referral code. Uses the
 * `NEXT_PUBLIC_SITE_URL` env (which we set when running on ngrok / Vercel)
 * with a localhost fallback for dev.
 */
export function shareUrlFor(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/signup?ref=${encodeURIComponent(code)}`;
}

/**
 * Default share copy. Used by the native Share API and the copy-to-clipboard
 * fallback on desktop.
 */
export function shareMessageFor(code: string, displayName: string): { title: string; text: string; url: string } {
  return {
    title: "Join me on BIZI",
    text: `${displayName} sent you a BIZI invite — trade skills, not money.`,
    url: shareUrlFor(code),
  };
}
