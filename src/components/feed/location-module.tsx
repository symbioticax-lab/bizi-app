"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, ChevronDown, LayoutGrid, List } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { dispatchFeedView, readFeedView } from "@/components/feed/feed-grid";

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "newest",      label: "Newest" },
  { id: "near-you",    label: "Near You" },
  { id: "popular",     label: "Most Popular" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

function isSortId(v: string | null): v is SortId {
  return SORT_OPTIONS.some((o) => o.id === v);
}

type Props = {
  location?: string | null;
};

export function LocationModule({ location }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawSort = searchParams.get("sort");
  const activeSort: SortId = isSortId(rawSort) ? rawSort : "recommended";
  const activeLabel = SORT_OPTIONS.find((o) => o.id === activeSort)?.label ?? "Recommended";

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const setSort = (sortId: SortId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortId);
    router.push(`/?${params.toString()}`);
    setOpen(false);
  };

  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  useEffect(() => {
    setActiveView(readFeedView());
    const handler = (e: Event) => setActiveView((e as CustomEvent<"grid" | "list">).detail);
    window.addEventListener("bizi-feed-view-change", handler);
    return () => window.removeEventListener("bizi-feed-view-change", handler);
  }, []);

  const setView = (v: "grid" | "list") => {
    setActiveView(v);
    dispatchFeedView(v);
  };

  const displayLocation = location
    ? location.split(",").slice(0, 2).join(",").trim()
    : "Set location";

  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      {/* Left: location */}
      <div className="flex min-w-0 items-center gap-1.5">
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm text-foreground/80">{displayLocation}</span>
        <Link
          href="/profile/edit"
          className="shrink-0 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Change
        </Link>
      </div>

      {/* Right: view toggle (desktop only) + sort dropdown */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Grid / List toggle — desktop only */}
        <div className="hidden lg:flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={activeView === "grid"}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              activeView === "grid"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={activeView === "list"}
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              activeView === "list"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>

        {/* Sort dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            <span className="text-white/50">Sort:</span>
            <span className="font-medium text-primary">{activeLabel}</span>
            <ChevronDown
              className={cn("size-3.5 text-primary transition-transform duration-200", open && "rotate-180")}
            />
          </button>

          {open && (
            <div
              className={cn(
                "absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden",
                "rounded-xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl",
                "shadow-[0_8px_32px_-8px_rgb(0_0_0/0.7)]",
              )}
            >
              {SORT_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSort(id)}
                  className={cn(
                    "flex w-full items-center px-4 py-2.5 text-sm transition-colors text-left",
                    id === activeSort
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  {label}
                  {id === activeSort && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
