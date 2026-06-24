import { Sparkles } from "lucide-react";
import { TIER_NAMES, type SubscriptionTier } from "@/lib/subscription/tiers";
import { cn } from "@/lib/utils";

type Props = {
  tier: SubscriptionTier | null | undefined;
  /** "onMedia" reads on a photo/dark hero; "default" reads on the page surface. */
  variant?: "onMedia" | "default";
  className?: string;
};

export function TierBadge({ tier, variant = "default", className }: Props) {
  if (!tier || tier === "free") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-none",
        "border-primary/40 bg-primary/15 text-primary",
        variant === "onMedia" && "backdrop-blur-md drop-shadow",
        className,
      )}
      title={`${TIER_NAMES[tier]} member`}
    >
      <Sparkles className="size-3" />
      {TIER_NAMES[tier]}
    </span>
  );
}
