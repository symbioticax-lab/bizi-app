"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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

      {/* Right: sort dropdown */}
      <div ref={dropdownRef} className="relative shrink-0">
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
  );
}
