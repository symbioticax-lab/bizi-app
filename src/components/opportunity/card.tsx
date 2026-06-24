"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, Star } from "lucide-react";
import { TapButton } from "@/components/profile/tap-button";
import { StatusBadge } from "@/components/feed/status-badge";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/lib/supabase/types";

type CardOpportunity = Pick<
  Opportunity,
  "id" | "title" | "category" | "offering_title" | "want_title" | "image_urls" | "created_at" | "owner_id" | "intent"
> & { view_count?: number };

function getExchangeLabel(wantTitle: string): string {
  if (wantTitle.startsWith("$") || /^\d/.test(wantTitle)) {
    return `Budget: ${wantTitle}`;
  }
  return `Exchange: ${wantTitle}`;
}

export function OpportunityCard({ opportunity }: { opportunity: CardOpportunity }) {
  const cover = opportunity.image_urls?.[0];

  const createdAt = new Date(opportunity.created_at);
  const hoursSince = (Date.now() - createdAt.getTime()) / 3_600_000;
  const isNew = hoursSince < 48;
  const isTrending = (opportunity.view_count ?? 0) > 50;

  const badgeStatus = isNew ? "new" : isTrending ? "trending" : null;

  const tags = [opportunity.category, opportunity.offering_title].filter(Boolean);

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-xl cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
      {/* Full-bleed cover image or gradient fallback */}
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-indigo-950">
          <ArrowLeftRight className="size-8 text-white/20" />
        </div>
      )}

      {/* Navigates to listing detail */}
      <Link href={`/opportunities/${opportunity.id}`} className="absolute inset-0 z-10" aria-label={opportunity.title} />

      {/* Top-left badges: NEW/TRENDING stacked above BARTER when both present */}
      {(badgeStatus || opportunity.intent === "trade-skills") && (
        <div className="absolute left-2 top-2 z-20 flex flex-col items-start gap-1">
          {badgeStatus && <StatusBadge status={badgeStatus} />}
          {opportunity.intent === "trade-skills" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              <ArrowLeftRight className="size-2.5" />
              BARTER
            </span>
          )}
        </div>
      )}

      {/* Save / star button — sibling of Link, won't trigger navigation */}
      <button
        aria-label="Save listing"
        className="absolute right-2 top-2 z-30 rounded-full bg-black/30 p-1 transition-colors hover:bg-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Star className="size-3.5 text-white/60 hover:text-[hsl(var(--status-gold))] transition-colors" />
      </button>

      {/* Bottom gradient scrim + metadata */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3">
        <p className="line-clamp-1 text-sm font-semibold text-white">{opportunity.title}</p>
        <p className="mt-0.5 text-[11px] text-white/55">
          {getExchangeLabel(opportunity.want_title ?? "")}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tap action — absolute positioned, sibling of Link */}
      <div className="absolute bottom-2 right-2 z-30">
        <TapButton
          targetType="listing"
          targetId={opportunity.id}
          ownerId={opportunity.owner_id}
          variant="compact"
        />
      </div>
    </div>
  );
}
