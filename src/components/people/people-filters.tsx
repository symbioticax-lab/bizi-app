"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, ArrowUpDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "top",    label: "Top rated" },
  { id: "active", label: "Most active" },
  { id: "az",     label: "A → Z" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function isSortId(value: string): value is SortId {
  return (SORT_OPTIONS as readonly { id: string }[]).some((o) => o.id === value);
}

type Props = {
  popularSkills: string[];
};

export function PeopleFilters({ popularSkills }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const q = params.get("q") ?? "";
  const sort = (params.get("sort") ?? "newest") as SortId;
  const skillsParam = params.get("skills") ?? "";
  const selectedSkills = skillsParam.split(",").map((s) => s.trim()).filter(Boolean);

  function update(next: Record<string, string | null>) {
    const usp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) usp.delete(k);
      else usp.set(k, v);
    }
    const qs = usp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleSkill(skill: string) {
    const next = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    update({ skills: next.length > 0 ? next.join(",") : null });
  }

  function clearAll() {
    update({ q: null, sort: null, skills: null });
  }

  const hasActiveFilters = Boolean(q || skillsParam || sort !== "newest");
  const sortLabel = SORT_OPTIONS.find((s) => s.id === sort)?.label ?? "Newest";

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = (new FormData(e.currentTarget).get("q") as string) ?? "";
          update({ q: value.trim() || null });
        }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search by name or @handle…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">Search</Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" type="button" className="gap-1.5">
              <ArrowUpDown className="size-4" />
              <span className="hidden sm:inline text-muted-foreground">Sort:</span>
              <span>{sortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {SORT_OPTIONS.map((opt) => {
              const active = opt.id === sort;
              return (
                <DropdownMenuItem
                  key={opt.id}
                  onSelect={() => update({ sort: opt.id === "newest" ? null : opt.id })}
                  className="gap-2"
                >
                  {active
                    ? <Check className="size-4 text-primary" />
                    : <span aria-hidden className="size-4" />}
                  <span className={cn(active && "font-medium text-primary")}>{opt.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      {/* Skill chips — derived from the most-used tags across all profiles */}
      {popularSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {popularSkills.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                aria-pressed={active}
                className="group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all duration-150 group-active:scale-95",
                    !active &&
                      "group-hover:border-primary group-hover:text-primary group-hover:shadow-[0_0_18px_-2px_hsl(var(--primary)/0.5)]" +
                      " group-active:border-primary group-active:text-primary",
                  )}
                >
                  {skill}
                </Badge>
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
