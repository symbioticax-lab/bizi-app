import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AvatarUploadButton } from "./avatar-upload-button";
import { LiveStatus } from "@/components/presence/live-status";
import { TierBadge } from "@/components/subscription/tier-badge";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { cn, initials } from "@/lib/utils";

type Props = {
  /** Owner's user id — required when isOwner is true (for inline avatar upload). */
  userId?: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  verified: boolean;
  status: "online" | "available" | "busy" | "away";
  /** ISO timestamp of the user's last activity — drives the live presence label. */
  lastSeenAt?: string | null;
  /** Subscription tier — renders a Bizi Plus+ badge next to the name. */
  tier?: SubscriptionTier | null;
  isOwner: boolean;
  /** When true, the hero has actual media behind us, so use light-on-dark
      styling. When false, it's the accent-color placeholder, so use a
      slightly different scrim. */
  onMedia: boolean;
};

const STATUS_META: Record<Props["status"], { label: string; dotClass: string }> = {
  online:    { label: "Online",    dotClass: "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" },
  available: { label: "Available", dotClass: "bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]" },
  busy:      { label: "Busy",      dotClass: "bg-amber-400" },
  away:      { label: "Away",      dotClass: "bg-zinc-400" },
};

/**
 * Identity strip rendered on top of the ProfileHero. Mockup-faithful in spirit
 * (status dot, location pill, skill pills, ADD TAGS, response time) but kept
 * in BIZI brand language — glass pills, lime accent, monochrome over hero.
 *
 * Renders inside the hero's overlay slot. Pinned to the bottom-left.
 */
export function IdentityStrip({
  userId, displayName, username, avatarUrl, verified, status,
  lastSeenAt, tier, isOwner, onMedia,
}: Props) {
  const statusMeta = STATUS_META[status];

  const avatarVisual = (
    <Avatar className="h-16 w-16 ring-4 ring-black/40 md:h-20 md:w-20">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initials(displayName)}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn(
      "mt-auto flex flex-col gap-3 p-5 md:p-7",
      // When there's no media, the placeholder backdrop is solid color — drop
      // the extra dark scrim that the gradient already provides.
      !onMedia && "bg-black/15"
    )}>
      {/* Avatar + name + handle — identity only. Skills, response time, and
          location now live in the calmer content area below the hero. */}
      <div className="flex items-end gap-4">
        {isOwner && userId ? (
          <AvatarUploadButton userId={userId}>{avatarVisual}</AvatarUploadButton>
        ) : (
          avatarVisual
        )}

        <div className="flex-1 space-y-1.5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            {lastSeenAt !== undefined ? (
              <LiveStatus lastSeenAt={lastSeenAt} dotOnly />
            ) : (
              <span
                aria-label={`Status: ${statusMeta.label}`}
                className={cn("inline-block size-2.5 rounded-full", statusMeta.dotClass)}
              />
            )}
            <h1 className="text-2xl font-semibold leading-tight drop-shadow md:text-3xl">
              {displayName}
            </h1>
            {verified && (
              <BadgeCheck className="size-5 text-primary drop-shadow" aria-label="Verified" />
            )}
            <TierBadge tier={tier} variant="onMedia" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
            <span>@{username}</span>
            <span aria-hidden>·</span>
            {lastSeenAt !== undefined ? (
              <LiveStatus lastSeenAt={lastSeenAt} />
            ) : (
              <span>{statusMeta.label}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-exported for use elsewhere (e.g., on negotiation thread, listing detail).
export { Badge };
