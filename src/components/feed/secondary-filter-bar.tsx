"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DiscoverTab } from "@/components/discover/discover-tabs";

const PEOPLE_FILTERS = [
  { id: "all",         label: "All" },
  { id: "near-you",    label: "Near You" },
  { id: "active-now",  label: "Active Now" },
  { id: "recommended", label: "Recommended" },
] as const;

const OPPORTUNITY_FILTERS = [
  { id: "nearby",    label: "Nearby" },
  { id: "all",       label: "All Opportunities" },
  { id: "paid",      label: "Paid" },
  { id: "exchange",  label: "Exchange" },
  { id: "collabs",   label: "Collabs" },
  { id: "saved",     label: "Saved" },
] as const;

type PeopleFilter      = (typeof PEOPLE_FILTERS)[number]["id"];
type OpportunityFilter = (typeof OPPORTUNITY_FILTERS)[number]["id"];
type AnyFilter         = PeopleFilter | OpportunityFilter;

function getFilters(tab: DiscoverTab) {
  return tab === "people" ? PEOPLE_FILTERS : OPPORTUNITY_FILTERS;
}

function defaultFilter(tab: DiscoverTab): AnyFilter {
  return tab === "people" ? "near-you" : "nearby";
}

export function SecondaryFilterBar() {
  const searchParams = useSearchParams();
  const tab: DiscoverTab =
    searchParams.get("tab") === "people" ? "people" : "opportunities";
  const activeFilter = (searchParams.get("filter") ?? defaultFilter(tab)) as AnyFilter;
  const filters = getFilters(tab);

  const buildHref = (filterId: AnyFilter) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("filter", filterId);
    // Preserve sort if present
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    return `/?${params.toString()}`;
  };

  return (
    <div className="border-b border-border/30 bg-background/75 backdrop-blur-xl">
      {/* container centers pills on wide desktop screens while preserving horizontal scroll */}
      <div className="container mx-auto">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-background/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-background/80 to-transparent z-10" />
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
            {filters.map(({ id, label }) => {
              const isActive = id === activeFilter;
              return (
                <Link
                  key={id}
                  href={buildHref(id as AnyFilter)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.45)]"
                      : "border border-white/[0.09] bg-secondary/60 text-muted-foreground hover:border-white/20 hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
