"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Star, MapPin, ArrowLeftRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatchListing = {
  id: string;
  title: string;
  category: string;
  offering_title: string;
  want_title: string;
  image_urls: string[];
  intent: string | null;
  owner_id: string;
};

export type MatchData = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  rating_avg: number;
  listings: MatchListing[];
};

// ── Small card (tap target in the results list) ────────────────────────────────

function MatchCard({
  profile,
  highlight,
  onClick,
}: {
  profile: MatchData;
  highlight: string[];
  onClick: () => void;
}) {
  const matchingSkill = profile.skills.find((s) => highlight.includes(s));
  const bioExcerpt = profile.bio
    ? profile.bio.slice(0, 70).trimEnd() + (profile.bio.length > 70 ? "…" : "")
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.04] p-3 text-left backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98]"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-white/10">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm font-medium text-foreground/70">
            {profile.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {profile.display_name}
        </p>
        {bioExcerpt ? (
          <p className="truncate text-xs text-muted-foreground">{bioExcerpt}</p>
        ) : (
          <p className="truncate text-xs text-muted-foreground">
            {matchingSkill ? `Offers ${matchingSkill}` : profile.skills[0] ?? "New on BIZI"}
            {profile.location ? ` · ${profile.location}` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-center gap-0.5 text-xs text-foreground/80">
          <Star className="size-3.5 fill-primary text-primary" />
          {profile.rating_avg ? profile.rating_avg.toFixed(1) : "—"}
        </div>
        <span className="text-[10px] text-primary/70">Tap to preview</span>
      </div>
    </button>
  );
}

// ── Listing row inside the preview ────────────────────────────────────────────

function ListingRow({ listing }: { listing: MatchListing }) {
  const cover = listing.image_urls?.[0];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ArrowLeftRight className="size-4 text-white/20" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          Wants: {listing.want_title}
        </p>
      </div>
    </div>
  );
}

// ── Profile preview content ───────────────────────────────────────────────────

function ProfilePreview({ profile, highlight }: { profile: MatchData; highlight: string[] }) {
  const matchingSkills = profile.skills.filter((s) => highlight.includes(s));

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3.5 pr-6">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-white/10">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xl font-semibold text-foreground/60">
              {profile.display_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            {profile.display_name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {profile.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-foreground/70">
              <Star className="size-3 fill-primary text-primary" />
              {profile.rating_avg ? profile.rating_avg.toFixed(1) : "New"}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Offers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  matchingSkills.includes(s)
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.05] text-foreground/60",
                )}
              >
                {s}
              </span>
            ))}
          </div>
          {matchingSkills.length > 0 && (
            <p className="mt-2 text-[11px] text-primary/80">
              ✦ Offers what you&apos;re looking for
            </p>
          )}
        </div>
      )}

      {/* Listings */}
      {profile.listings.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Active listings
          </p>
          <div className="flex flex-col gap-1.5">
            {profile.listings.map((l) => (
              <ListingRow key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      {profile.listings.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/50">No active listings yet</p>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function MatchCardsClient({
  matches,
  highlight,
}: {
  matches: MatchData[];
  highlight: string[];
}) {
  const [selected, setSelected] = useState<MatchData | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            profile={m}
            highlight={highlight}
            onClick={() => setSelected(m)}
          />
        ))}
        {matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-muted-foreground">
            No active profiles yet — you might be one of the first!
          </div>
        )}
      </div>

      {/* Bottom-sheet dialog */}
      <DialogPrimitive.Root
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto",
              "rounded-t-2xl border-t border-x border-white/[0.08] bg-[hsl(248,22%,9%)] p-5 pb-8",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
              "data-[state=open]:duration-300 data-[state=closed]:duration-200",
            )}
          >
            {/* Drag handle */}
            <div className="mb-5 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            <DialogPrimitive.Title className="sr-only">
              {selected?.display_name}&apos;s profile preview
            </DialogPrimitive.Title>

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-white/[0.06] hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {selected && (
              <ProfilePreview profile={selected} highlight={highlight} />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
