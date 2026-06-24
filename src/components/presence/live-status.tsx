"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getPresence, type PresenceTier } from "@/lib/presence";

// Dot colour per tier — maps presence warmth to colour warmth.
// online:  emerald  — "I'm here right now"
// recent:  amber    — "just here, reach out"
// 1h:      amber/dim — "worth messaging"
// 6h:      warm stone — "cooling off"
// 12h:     muted stone — "not active today"
// 24h+:    zinc     — "haven't been around"
// offline: zinc/dim — "no data"
const TIER_DOT: Record<PresenceTier, string> = {
  online:  "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]",
  recent:  "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.28)]",
  "1h":    "bg-amber-400/70",
  "6h":    "bg-stone-400/60",
  "12h":   "bg-stone-500/45",
  "24h":   "bg-zinc-500/40",
  offline: "bg-zinc-600/35",
};

/**
 * Live-updating presence label. Re-computes every 30s so the bucket label
 * keeps ticking without a page reload. Renders a coloured dot + text.
 */
export function LiveStatus({
  lastSeenAt,
  className,
  dotOnly = false,
}: {
  lastSeenAt: string | null;
  className?: string;
  dotOnly?: boolean;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const { tier, label } = getPresence(lastSeenAt);

  const dot = (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 size-2 rounded-full transition-colors duration-500",
        TIER_DOT[tier],
      )}
    />
  );

  if (dotOnly) return dot;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {dot}
      <span>{label}</span>
    </span>
  );
}
