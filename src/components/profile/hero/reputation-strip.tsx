import Link from "next/link";
import { Star, Plus, Pencil, MapPin } from "lucide-react";
import { HeroPill } from "./hero-pill";
import { cn } from "@/lib/utils";

type Props = {
  ratingAvg: number;
  reviewCount: number;
  completedTrades: number;
  isOwner: boolean;
  /** Non-empty only for signed-out visitors — used to show a "Sign in" CTA. */
  signInHref: string;
  location?: string | null;
};

export function ReputationStrip({
  ratingAvg, reviewCount, completedTrades,
  isOwner, signInHref, location,
}: Props) {
  const rounded = reviewCount > 0 ? Math.round(ratingAvg * 2) / 2 : 0;
  const tradeWord = completedTrades === 1 ? "trade" : "trades";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5 md:px-7 md:pb-6">
      <div className="flex flex-col gap-2">
        {/* Stats row: rating · reviews · trades · listings */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <span className="flex items-center gap-1.5">
            <Stars rating={rounded} />
            <span className="text-sm font-semibold">
              {reviewCount > 0 ? ratingAvg.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-white/50">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </span>
          <span aria-hidden className="text-xs text-white/25">·</span>
          <span className="text-xs text-white/65">
            {completedTrades} {tradeWord} completed
          </span>
        </div>
        {location && (
          <HeroPill icon={<MapPin className="size-3.5" />}>
            {location}
          </HeroPill>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ConnectCTA isOwner={isOwner} signInHref={signInHref} />
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  // rating is in halves (0, 0.5, 1, 1.5, ..., 5)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <span key={i} className="relative inline-block size-4">
            <Star className="absolute inset-0 size-4 fill-white/15 text-white/15" />
            {(filled || half) && (
              <Star
                className={cn(
                  "absolute inset-0 size-4 fill-primary text-primary",
                  half && "[clip-path:inset(0_50%_0_0)]",
                )}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

function ConnectCTA({
  isOwner, signInHref,
}: {
  isOwner: boolean;
  signInHref: string;
}) {
  if (isOwner) {
    return (
      <Link
        href="/profile/edit"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <Pencil className="size-4" /> Edit profile
      </Link>
    );
  }

  // Signed-out visitor — nudge to sign in
  if (signInHref) {
    return (
      <Link
        href={signInHref}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="size-4" /> Sign in to connect
      </Link>
    );
  }

  // Signed-in visitor — their CTAs live in StickyProfileBar above the hero
  return null;
}
