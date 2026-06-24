"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function DiscoverFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";

  function update(next: Record<string, string | null>) {
    const usp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) usp.delete(k);
      else usp.set(k, v);
    }
    const qs = usp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = (new FormData(e.currentTarget).get("q") as string) ?? "";
          update({ q: value.trim() || null });
        }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search listings…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          label="All"
          active={!category}
          onSelect={() => update({ category: null })}
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={c}
            active={c === category}
            onSelect={() => update({ category: c === category ? null : c })}
          />
        ))}
        {(category || q) && (
          <button
            type="button"
            onClick={() => update({ category: null, q: null })}
            className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Lime-glow chip used for the category filter row. When inactive, hovering
 * (or active-pressing on touch devices) lights the outline up in primary
 * with a soft lime drop-glow. When active, fills with lime as the persistent
 * "this filter is on" state.
 */
function FilterChip({
  label, active, onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Badge
        variant={active ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-all duration-150 group-active:scale-95",
          // Lime glow on hover/touch — only when not already filled
          !active &&
            "group-hover:border-primary group-hover:text-primary group-hover:shadow-[0_0_18px_-2px_hsl(var(--primary)/0.5)]" +
            " group-active:border-primary group-active:text-primary group-active:shadow-[0_0_24px_-2px_hsl(var(--primary)/0.7)]",
        )}
      >
        {label}
      </Badge>
    </button>
  );
}
