"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tier = { num: number; name: string };

type Props = {
  journey: Tier;
  referral: Tier;
};

const STORAGE_KEYS = {
  journey: "bizi_seen_journey_tier",
  referral: "bizi_seen_referral_tier",
} as const;

const BRAND_COLORS = ["#D4FF3D", "#A0E33A", "#FFFFFF", "#9CFF00"];

type Celebration = {
  source: "journey" | "referral";
  tierNum: number;
  tierName: string;
};

/**
 * Detects when a user has crossed into a new reward tier since their last
 * visit and fires a confetti burst + a top-of-screen banner. Tracks "seen"
 * tier numbers in localStorage so each level-up celebrates exactly once.
 *
 * On a user's first ever visit (no stored values), records current tiers
 * silently — first level-up to celebrate is the user's first move beyond Lvl 1.
 */
export function TierCelebration({ journey, referral }: Props) {
  const [active, setActive] = useState<Celebration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const seenJourneyRaw = window.localStorage.getItem(STORAGE_KEYS.journey);
    const seenReferralRaw = window.localStorage.getItem(STORAGE_KEYS.referral);
    const seenJourney = seenJourneyRaw === null ? null : Number.parseInt(seenJourneyRaw, 10);
    const seenReferral = seenReferralRaw === null ? null : Number.parseInt(seenReferralRaw, 10);

    // First visit ever: record current tiers but don't celebrate. Otherwise
    // we'd fire confetti at every brand-new user, which is noise.
    if (seenJourney === null) window.localStorage.setItem(STORAGE_KEYS.journey, String(journey.num));
    if (seenReferral === null) window.localStorage.setItem(STORAGE_KEYS.referral, String(referral.num));
    if (seenJourney === null || seenReferral === null) return;

    let toCelebrate: Celebration | null = null;
    if (journey.num > seenJourney) {
      window.localStorage.setItem(STORAGE_KEYS.journey, String(journey.num));
      toCelebrate = { source: "journey", tierNum: journey.num, tierName: journey.name };
    }
    // Referral takes priority over journey if both leveled up the same render
    // (rare but possible) — the user sees both bursts because we re-fire below.
    if (referral.num > seenReferral) {
      window.localStorage.setItem(STORAGE_KEYS.referral, String(referral.num));
      toCelebrate = { source: "referral", tierNum: referral.num, tierName: referral.name };
    }

    if (toCelebrate) {
      fireConfetti();
      setActive(toCelebrate);
      const t = setTimeout(() => setActive(null), 5000);
      return () => clearTimeout(t);
    }
  }, [journey.num, journey.name, referral.num, referral.name]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-1/2 top-4 z-[60] -translate-x-1/2",
        "flex max-w-[92vw] items-center gap-3 rounded-full",
        "border border-primary/40 bg-primary/15 px-4 py-2.5 text-sm font-medium text-foreground",
        "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.6)] backdrop-blur-md",
        "animate-in slide-in-from-top-4 fade-in-0 duration-500",
      )}
    >
      <Trophy className="size-5 text-primary" />
      <span>
        <span className="text-primary font-semibold">Lvl {active.tierNum} — {active.tierName}</span>
        <span className="ml-1 text-foreground/85">
          unlocked · {active.source === "referral" ? "referral milestone hit" : "journey milestone hit"}
        </span>
      </span>
      <button
        type="button"
        onClick={() => setActive(null)}
        aria-label="Dismiss"
        className="ml-1 rounded-full p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Two-corner confetti shower, brand-colored. Bursts continuously for ~2.5s.
 * Particles shoot inward + upward from the bottom corners, framing the screen
 * without occluding content.
 */
function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  // Initial big burst from center for impact
  confetti({
    particleCount: 80,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 1.1,
  });

  // Continuous shower from both bottom corners
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.95 },
      colors: BRAND_COLORS,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.95 },
      colors: BRAND_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
