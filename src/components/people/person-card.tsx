import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Users, Star, Plus, MapPin, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { distanceLabel } from "@/lib/geo";
import { LiveStatus } from "@/components/presence/live-status";
import { ConnectButton, type ConnectStatus } from "./connect-button";
import { FollowButton } from "./follow-button";

export type Person = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  hero_url: string | null;
  rating_avg: number;
  review_count: number;
  skills: string[];
  location: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  verified: boolean;
  status?: string | null;
  last_seen_at?: string | null;
};

type Props = {
  person: Person;
  bookmarkable?: boolean;
  viewerLat?: number | null;
  viewerLng?: number | null;
  hasTravelPlans?: boolean;
  viewerId?: string | null;
  connectionStatus?: ConnectStatus;
  isFollowing?: boolean;
};

// ── Image fallback gradients ───────────────────────────────────────────────────

const GRADIENTS = [
  "from-violet-900/90 via-purple-900/70 to-indigo-950",
  "from-slate-800 via-slate-900 to-zinc-950",
  "from-emerald-900/80 via-teal-900/60 to-slate-950",
  "from-rose-900/70 via-pink-900/50 to-slate-950",
  "from-amber-900/70 via-orange-900/50 to-slate-950",
  "from-blue-900/80 via-cyan-900/60 to-slate-950",
];

function fallbackGradient(id: string): string {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonCard({ person, viewerLat, viewerLng, hasTravelPlans, viewerId, connectionStatus, isFollowing }: Props) {
  const photo    = person.avatar_url ?? person.hero_url;
  const role     = person.skills?.[0] ?? null;
  const gradient = fallbackGradient(person.id);

  // Approximate distance when both sides have coordinates; else show their city.
  const distance        = distanceLabel(
    { lat: viewerLat, lng: viewerLng },
    { lat: person.location_lat, lng: person.location_lng },
  );
  const locationDisplay = distance ?? person.location ?? null;

  return (
    <Link
      href={`/profile/${person.username}`}
      aria-label={`View ${person.display_name}'s profile`}
      className={cn(
        "group block",
        // card lift on tap (CSS active, no JS needed)
        "active:scale-[0.97]",
      )}
    >
      <div
        className={cn(
          // Layout — `isolate` scopes any child z-index to this card so nothing
          // can paint over the sticky tab/filter bars while scrolling.
          "relative isolate flex flex-col overflow-hidden rounded-2xl",
          // Surface — theme-aware background and border
          "bg-card dark:bg-[hsl(230,20%,8%)]",
          "border border-border dark:border-white/[0.065]",
          // Depth: outer shadow + subtle inset highlight
          "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_4px_28px_-6px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.045)]",
          // Hover elevation
          "transition-all duration-[280ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          "group-hover:scale-[1.026]",
          "group-hover:shadow-[0_6px_24px_-6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(0,0,0,0.06)]",
          "dark:group-hover:shadow-[0_18px_56px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.07)]",
          "group-hover:border-border/80 dark:group-hover:border-white/[0.105]",
        )}
      >
        {/* ── Inset image — px-1.5 pt-1.5 creates 6px gap on top/sides ─── */}
        <div className="px-[6px] pt-[6px]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[14px]">
            {photo ? (
              <Image
                src={photo}
                alt=""
                fill
                className={cn(
                  "object-cover object-top",
                  // Slow zoom on card hover for cinematic feel
                  "transition-transform duration-[500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  "group-hover:scale-[1.06]",
                )}
                sizes="(max-width: 640px) calc(50vw - 20px), (max-width: 1024px) calc(33vw - 18px), 220px"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center",
                  "bg-gradient-to-br",
                  gradient,
                  "transition-transform duration-[500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                  "group-hover:scale-[1.06]",
                )}
              >
                <span className="select-none text-6xl font-black text-white/[0.12] leading-none">
                  {person.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Travel badge */}
            {hasTravelPlans && (
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                <Plane className="size-2.5 text-white/80" />
                <span className="text-[10px] font-medium leading-none text-white/80">Traveling</span>
              </div>
            )}

            {/* Depth gradient at bottom of image — bleeds into card body */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card dark:from-[hsl(230,20%,8%)] dark:via-[hsl(230,20%,8%)/30%] to-transparent" />
          </div>
        </div>

        {/* ── Creator identity + CTA ─────────────────────────────────────── */}
        <div className="flex flex-col gap-[10px] px-[11px] pb-[11px] pt-[9px]">

          {/* Name + verified */}
          <div>
            <div className="flex min-w-0 items-center gap-[5px]">
              <h3 className={cn(
                "truncate leading-[1.2] tracking-[-0.015em]",
                "text-[13px] font-semibold text-foreground dark:text-white/95",
                "sm:text-[13.5px]",
              )}>
                {person.display_name}
              </h3>
              {person.verified && (
                <BadgeCheck className="size-[14px] shrink-0 fill-blue-500/20 text-blue-400" />
              )}
            </div>
            {role && (
              <p className="mt-[3px] truncate text-[11px] leading-none text-muted-foreground dark:text-white/38">
                {role}
              </p>
            )}
          </div>

          {/* Presence — accurate dot + bucketed "last seen" label, live-updating */}
          <LiveStatus
            lastSeenAt={person.last_seen_at ?? null}
            className="text-[10.5px] leading-none text-muted-foreground dark:text-white/40"
          />

          {/* Location / distance */}
          {locationDisplay && (
            <div className="flex items-center gap-[4px] text-[11px] text-muted-foreground dark:text-white/35">
              <MapPin className="size-[11px] shrink-0" />
              <span className="truncate">{locationDisplay}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-[10px] text-[10.5px] text-muted-foreground dark:text-white/32">
            <span className="flex items-center gap-[4px]">
              <Users className="size-[11px] shrink-0" />
              <span className="tabular-nums">{person.review_count ?? 0}</span>
            </span>
            <span className="flex items-center gap-[4px]">
              <Star className="size-[11px] shrink-0" />
              <span className="tabular-nums">
                {person.rating_avg ? Number(person.rating_avg).toFixed(1) : "—"}
              </span>
            </span>
          </div>

          {/* Connect + Follow CTAs */}
          {viewerId && viewerId !== person.id ? (
            <div className="grid grid-cols-2 gap-1.5">
              <ConnectButton
                recipientId={person.id}
                displayName={person.display_name}
                status={connectionStatus ?? "none"}
              />
              <FollowButton
                followeeId={person.id}
                isFollowing={isFollowing ?? false}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center gap-[5px]",
                "rounded-[10px] py-[7px]",
                "bg-secondary dark:bg-white/[0.05] border border-border dark:border-white/[0.07] backdrop-blur-sm",
                "text-[11.5px] font-medium text-muted-foreground dark:text-white/55 leading-none tracking-[0.005em]",
                "transition-all duration-[220ms]",
                "group-hover:bg-secondary/80 dark:group-hover:bg-white/[0.10] group-hover:border-border/80 dark:group-hover:border-white/[0.14] group-hover:text-foreground dark:group-hover:text-white/85",
              )}
            >
              Connect
              <Plus className="size-[11px] text-muted-foreground/60 dark:text-white/40 transition-colors duration-[220ms] group-hover:text-foreground dark:group-hover:text-white/70" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
