"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/negotiations", label: "Negotiations", icon: Handshake },
] as const;

export function TradeTabs() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container py-2">
        <div className="flex max-w-md gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
