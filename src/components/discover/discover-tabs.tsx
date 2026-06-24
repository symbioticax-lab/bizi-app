"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiscoverTab = "people" | "opportunities";

const TABS: { id: DiscoverTab; label: string; icon: typeof Users }[] = [
  { id: "opportunities", label: "Opportunities", icon: Layers },
  { id: "people",        label: "People",        icon: Users },
];

export function isDiscoverTab(v: string | null): v is DiscoverTab {
  return v === "people" || v === "opportunities";
}

export function DiscoverTabs() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: DiscoverTab = isDiscoverTab(rawTab) ? rawTab : "opportunities";

  const buildHref = (tabId: DiscoverTab) => {
    const params = new URLSearchParams();
    params.set("tab", tabId);
    return `/?${params.toString()}`;
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center gap-1 px-4 py-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab;
          return (
            <Link
              key={id}
              href={buildHref(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
