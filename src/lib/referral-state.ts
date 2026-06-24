// Server-only helper for the ReferralCard. Resolves the referral count for a
// given profile by counting other profiles that have referred_by_id = profile.id.

import { createClient } from "@/lib/supabase/server";
import { tierForReferralCount, nextTierForReferralCount, shareUrlFor, type ReferralTier } from "./referrals";

export type ReferralState = {
  code: string | null;
  shareUrl: string | null;
  count: number;
  currentTier: ReferralTier;
  nextTier: ReferralTier | null;
  /** Progress toward next tier in percent (0–100). 100 when at top tier. */
  pctToNext: number;
  /** How many more referrals to reach the next tier (0 if at the top). */
  needed: number;
};

export async function loadReferralState(profileId: string, code: string | null): Promise<ReferralState> {
  const supabase = createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_id", profileId);

  const total = count ?? 0;
  const currentTier = tierForReferralCount(total);
  const nextTier = nextTierForReferralCount(total);

  let pctToNext = 100;
  let needed = 0;
  if (nextTier) {
    const span = nextTier.threshold - currentTier.threshold;
    const inTier = total - currentTier.threshold;
    pctToNext = span > 0 ? Math.min(100, Math.round((inTier / span) * 100)) : 0;
    needed = Math.max(0, nextTier.threshold - total);
  }

  return {
    code,
    shareUrl: code ? shareUrlFor(code) : null,
    count: total,
    currentTier,
    nextTier,
    pctToNext,
    needed,
  };
}
