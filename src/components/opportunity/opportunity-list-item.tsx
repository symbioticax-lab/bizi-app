"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftRight,
  Star,
  TrendingUp,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { distanceLabel } from "@/lib/geo";
import { BookmarkButton } from "@/components/saved/bookmark-button";
import type { Opportunity } from "@/lib/supabase/types";

export type ListOpportunity = Pick<
  Opportunity,
  "id" | "title" | "category" | "offering_title" | "want_title" | "image_urls" | "created_at" | "owner_id" | "intent" | "location" | "location_lat" | "location_lng"
> & { view_count?: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNewListing(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) / 3_600_000 < 48;
}

function isPaid(wantTitle: string) {
  return wantTitle.startsWith("$") || /^\d/.test(wantTitle);
}

// Strip a leading $ only when what follows is non-numeric (e.g. "$Negotiable" → "Negotiable").
// Numeric amounts like "$500" or "$200–800" are left unchanged.
function formatBudget(value: string): string {
  if (!value.startsWith("$")) return value;
  const stripped = value.slice(1);
  return /^\d/.test(stripped) ? value : stripped;
}

function isTrending(viewCount?: number) {
  return (viewCount ?? 0) > 50;
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  "Photography":           { label: "BRAND COLLAB",     color: "text-primary" },
  "Design":                { label: "DESIGN COLLAB",    color: "text-primary" },
  "Business & Consulting": { label: "BIZ COLLAB",       color: "text-primary" },
  "Marketing":             { label: "CONTENT CREATION", color: "text-[hsl(var(--status-new))]" },
  "Writing":               { label: "CONTENT CREATION", color: "text-[hsl(var(--status-new))]" },
  "Education & Tutoring":  { label: "EDU COLLAB",       color: "text-[hsl(var(--status-new))]" },
  "Video & Audio":         { label: "VIDEO PRODUCTION", color: "text-[hsl(var(--status-online))]" },
  "Music":                 { label: "MUSIC COLLAB",     color: "text-[hsl(var(--status-online))]" },
  "Development":           { label: "TECH COLLAB",      color: "text-blue-400" },
  "Home & Trades":         { label: "TRADE WORK",       color: "text-amber-400" },
  "Health & Wellness":     { label: "WELLNESS COLLAB",  color: "text-emerald-400" },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat.toUpperCase(), color: "text-primary" };
}

const INTENT_META: Record<string, { label: string; badge: string }> = {
  "need-help":        { label: "SEEKING",      badge: "border-primary/25 bg-primary/10 text-primary" },
  "offer-services":   { label: "OFFERING",     badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
  "trade-skills":     { label: "TRADING",      badge: "border-amber-500/25 bg-amber-500/10 text-amber-400" },
  "post-opportunity": { label: "OPPORTUNITY",  badge: "border-rose-500/25 bg-rose-500/10 text-rose-400" },
  "share-resources":  { label: "SHARING",      badge: "border-blue-500/25 bg-blue-500/10 text-blue-400" },
};

function getIntentMeta(intent: string | null | undefined) {
  return intent ? (INTENT_META[intent] ?? null) : null;
}

function timeAgo(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours < 1)  return "just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function CardBadge({ type }: { type: "new" | "trending" | "paid" }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg";

  if (type === "new")      return <span className={cn(base, "bg-primary")}><Star className="size-2.5 fill-white" />NEW</span>;
  if (type === "trending") return <span className={cn(base, "bg-[hsl(var(--status-new))]")}><TrendingUp className="size-2.5" />TRENDING</span>;
  return                          <span className={cn(base, "bg-[hsl(var(--status-online))]")}><DollarSign className="size-2.5" />PAID</span>;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function OpportunityListItem({
  opportunity,
  viewerLat,
  viewerLng,
}: {
  opportunity: ListOpportunity;
  viewerLat?: number | null;
  viewerLng?: number | null;
}) {
  const cover     = opportunity.image_urls?.[0];
  const paid      = isPaid(opportunity.want_title ?? "");
  const isNew     = !paid && isNewListing(opportunity.created_at);
  const trending  = !paid && !isNew && isTrending(opportunity.view_count);
  const badgeType = paid ? "paid" : isNew ? "new" : trending ? "trending" : null;

  const { label: categoryLabel, color: categoryColor } = getCategoryMeta(opportunity.category ?? "");
  const openExchange  = (opportunity.want_title ?? "") === "Open to any exchange";
  const exchangeLabel = paid ? "Budget" : "Exchange";
  const exchangeValue = opportunity.want_title ?? "";

  const rawTags    = (opportunity.offering_title ?? "").split(/[,/&]+/).map((t) => t.trim()).filter(Boolean);
  const tags       = rawTags.slice(0, 3);
  const extraTags  = rawTags.length - tags.length;
  const intentMeta = getIntentMeta(opportunity.intent);

  // City/area stays in the location slot; the approximate miles distance is
  // shown separately next to the date (only when both have coordinates).
  const locationDisplay = opportunity.location ?? null;
  const distance = distanceLabel(
    { lat: viewerLat, lng: viewerLng },
    { lat: opportunity.location_lat, lng: opportunity.location_lng },
    true,
  );

  return (
    <div
      className={cn(
        "flex min-h-[210px] overflow-hidden rounded-2xl",
        "border border-white/[0.07] bg-[hsl(248,22%,9%)]",
        "shadow-[0_2px_20px_-6px_rgb(0_0_0/0.6)]",
      )}
    >
      {/* ── Left: image inset with 7px margin on all sides ─────────────── */}
      <div className="w-[38%] shrink-0 p-[7px]">
        <div className="relative h-full overflow-hidden rounded-xl">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 38vw, 200px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-indigo-950">
              <ArrowLeftRight className="size-6 text-white/20" />
            </div>
          )}

          {/* Badge over the inset image */}
          {badgeType && (
            <div className="absolute left-2 top-2 z-10">
              <CardBadge type={badgeType} />
            </div>
          )}

          {/* Barter badge — bottom-left of image for trade-skills intent */}
          {opportunity.intent === "trade-skills" && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                <ArrowLeftRight className="size-2.5" />
                BARTER
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: content column ───────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4 pr-4 pl-1">

        {/* Intent (primary) + category (secondary) */}
        <div className="flex items-center gap-2">
          {intentMeta && (
            <span className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
              intentMeta.badge,
            )}>
              {intentMeta.label}
            </span>
          )}
          <p className="text-[10px] font-medium tracking-wide text-white/25">
            {categoryLabel}
          </p>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.3] text-white">
          {opportunity.title}
          {openExchange && (
            <span className="ml-1.5 inline-flex translate-y-[-1px] items-center rounded-full border border-primary/40 bg-primary/20 px-2 py-px text-[10px] font-bold text-primary">
              Open
            </span>
          )}
        </h3>

        {/* Exchange / Budget — hidden when open-ended */}
        {!openExchange && exchangeValue && (
          <div className="text-[12.5px] leading-snug">
            {paid ? (
              <span className="font-bold text-emerald-400">{formatBudget(exchangeValue)}</span>
            ) : (
              <p>
                <span className="text-white/30">wants </span>
                <span className="font-medium text-white/70">{exchangeValue}</span>
              </p>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/65"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/40">
                +{extraTags}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Meta: location · time posted · bookmark */}
        <div className="flex items-center gap-2.5 text-[11px] text-white/40">
          {(locationDisplay || distance) && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {[locationDisplay, distance].filter(Boolean).join(" · ")}
              </span>
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3 shrink-0" />
            {timeAgo(opportunity.created_at)}
          </span>
          <BookmarkButton
            itemType="listing"
            itemId={opportunity.id}
            variant="icon"
            className="ml-auto size-7 text-white/35 hover:text-white/70 [&_svg]:size-4"
          />
        </div>

        {/* View Details — full-width button extending to the image edge */}
        <Link
          href={`/opportunities/${opportunity.id}`}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-4 py-2",
            "bg-gradient-to-r from-violet-600 via-primary to-violet-500",
            "text-[13px] font-semibold text-white",
            "shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.55)]",
            "transition-all hover:opacity-90 hover:shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.75)] active:scale-[0.97]",
          )}
        >
          View Details
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
