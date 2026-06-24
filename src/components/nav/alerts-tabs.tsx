"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Hand, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertCounts } from "@/lib/alerts";

/**
 * Sub-navigation for the Alerts section. Three surfaces:
 *   - Notifications  →  /notifications  (system activity)
 *   - Taps           →  /taps           (who tapped you)
 *   - Views          →  /views          (who viewed your profile / listings)
 */
const TABS = [
  { href: "/notifications", label: "Notifications", icon: Bell, key: "notifications" },
  { href: "/taps", label: "Taps", icon: Hand, key: "taps" },
  { href: "/views", label: "Views", icon: Eye, key: "views" },
] as const;

export function AlertsTabs({ counts }: { counts: AlertCounts }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container py-2">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const count = counts[tab.key];
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <tab.icon className="size-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                      active ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
