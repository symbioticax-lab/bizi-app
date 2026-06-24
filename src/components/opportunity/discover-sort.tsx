"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const SORT_OPTIONS = [
  { id: "newest",  label: "Newest first" },
  { id: "oldest",  label: "Oldest first" },
  { id: "popular", label: "Most viewed" },
  { id: "trusted", label: "Highest-rated owners" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function isSortId(value: string): value is SortId {
  return (SORT_OPTIONS as readonly { id: string }[]).some((o) => o.id === value);
}

/**
 * Sort dropdown for the Discover feed. Reads + writes the `sort` URL param
 * so the active sort survives across reloads, share, and back-button.
 */
export function DiscoverSort() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const current = (params.get("sort") ?? "newest") as SortId;
  const currentLabel = SORT_OPTIONS.find((o) => o.id === current)?.label ?? "Newest first";

  function pick(id: SortId) {
    const usp = new URLSearchParams(params.toString());
    if (id === "newest") usp.delete("sort");
    else usp.set("sort", id);
    const qs = usp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowUpDown className="size-4" />
          <span className="hidden sm:inline text-muted-foreground">Sort:</span>
          <span>{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {SORT_OPTIONS.map((opt) => {
          const active = opt.id === current;
          return (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => pick(opt.id)}
              className="gap-2"
            >
              {active
                ? <Check className="size-4 text-primary" />
                : <span aria-hidden className="size-4" />}
              <span className={cn(active && "font-medium text-primary")}>
                {opt.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
