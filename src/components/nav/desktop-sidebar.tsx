"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Plane,
  Handshake,
  MessageSquare,
  Bookmark,
  Trophy,
  Plus,
  LayoutDashboard,
  Bell,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

type Props = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isPro: boolean;
  unreadCount: number;
  messageCount: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  matchFn: (pathname: string) => boolean;
  badgeCount?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function buildSections(isPro: boolean, messageCount: number, unreadCount: number): NavSection[] {
  return [
    {
      label: "Discover",
      items: [
        {
          href: "/",
          label: "Feed",
          icon: LayoutGrid,
          matchFn: (p) => p === "/" || p === "/people",
        },
        {
          href: "/travel",
          label: "Travel",
          icon: Plane,
          matchFn: (p) => p.startsWith("/travel"),
        },
      ],
    },
    {
      label: "Activity",
      items: [
        {
          href: "/negotiations",
          label: "Matches",
          icon: Handshake,
          matchFn: (p) => p.startsWith("/negotiations"),
        },
        {
          href: "/messages",
          label: "Messages",
          icon: MessageSquare,
          matchFn: (p) => p.startsWith("/messages"),
          badgeCount: messageCount,
        },
        {
          href: "/saved",
          label: "Saved",
          icon: Bookmark,
          matchFn: (p) => p.startsWith("/saved"),
        },
        {
          href: "/rewards",
          label: "Rewards",
          icon: Trophy,
          matchFn: (p) => p.startsWith("/rewards"),
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          href: isPro ? "/dashboard" : "/go-pro",
          label: isPro ? "Dashboard" : "Upgrade",
          icon: isPro ? LayoutDashboard : Zap,
          matchFn: (p) => p.startsWith("/dashboard") || p.startsWith("/go-pro"),
        },
        {
          href: "/notifications",
          label: "Alerts",
          icon: Bell,
          matchFn: (p) => p.startsWith("/notifications"),
          badgeCount: unreadCount,
        },
      ],
    },
  ];
}

export function DesktopSidebar({ username, displayName, avatarUrl, isPro, unreadCount, messageCount }: Props) {
  const [collapsed, setCollapsed] = React.useState(true);
  const pathname = usePathname();
  const sections = buildSections(isPro, messageCount, unreadCount);

  React.useEffect(() => {
    const stored = localStorage.getItem("bizi-sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("bizi-sidebar-collapsed", String(next));
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0",
        "border-r border-border/60",
        "bg-background/80 backdrop-blur-xl",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[4.5rem]" : "w-60",
      )}
    >
      {/* Toggle chevron */}
      <div className={cn("flex items-center py-3", collapsed ? "justify-center" : "justify-end px-3")}>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <ChevronRight
            className={cn("size-4 transition-transform duration-200", !collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Create / Post New — prominent CTA */}
      <div className="px-2 pb-4">
        <Link
          href="/opportunities/new"
          title="Post a listing"
          aria-label="Post a listing"
          className={cn(
            "flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-primary-foreground",
            "transition-all hover:opacity-90 active:scale-[0.98]",
            "shadow-[0_0_18px_-4px_hsl(var(--primary)/0.5)]",
            collapsed && "justify-center",
          )}
        >
          <Plus className="size-5 shrink-0" strokeWidth={2.5} />
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-semibold">Post New</span>
          )}
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex flex-col gap-5 flex-1 px-2 overflow-y-auto overflow-x-hidden">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.matchFn(pathname);
                const hasBadge = Boolean(item.badgeCount && item.badgeCount > 0);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <span className="relative shrink-0">
                      <item.icon
                        className="size-5"
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                      {hasBadge && (
                        <span
                          aria-label={`${item.badgeCount} unread`}
                          className="absolute -right-1 -top-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background"
                        >
                          {(item.badgeCount ?? 0) > 9 ? "9+" : item.badgeCount}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: user profile link */}
      {username && (
        <div className={cn("border-t border-border/60 p-2", collapsed && "flex justify-center")}>
          <Link
            href={`/profile/${username}`}
            title={collapsed ? (displayName || username) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/60 transition-colors",
              collapsed && "justify-center",
            )}
          >
            <Avatar className="size-8 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback className="text-xs">
                {initials(displayName ?? username ?? "U")}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName || username}</p>
                <p className="truncate text-xs text-muted-foreground">@{username}</p>
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
