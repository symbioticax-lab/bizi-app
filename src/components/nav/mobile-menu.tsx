"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  ChevronRight,
  ShieldCheck,
  Handshake,
  Bookmark,
  Trophy,
  LayoutDashboard,
  Pencil,
  Sparkles,
  Bell,
  HelpCircle,
  Info,
  FileText,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TierBadge } from "@/components/subscription/tier-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { logoutAction } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";

type Props = {
  signedIn: boolean;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  tier?: SubscriptionTier | null;
};

/**
 * Instagram-style "Settings and activity" panel. The top-right hamburger on the
 * profile opens a full-height sheet that slides in from the right (swipe
 * left-to-right to dismiss). It groups every account-management destination:
 * Accounts Center at the top, the overflow nav destinations (Trades, Saved,
 * Rewards, Dashboard, Edit Profile) that don't fit the 5-slot bottom nav, a
 * subscription entry, preferences (theme + notifications), help/about, and a
 * Sign Out pinned at the bottom — the only action that ends the session.
 */
export function MobileMenu({ signedIn, username, displayName, avatarUrl, tier }: Props) {
  const [open, setOpen] = React.useState(false);
  const isPaid = Boolean(tier && tier !== "free");
  const initials = (displayName || username || "?").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent onOpenChange={setOpen}>
        <SheetTitle className="px-4 pt-5 pb-3 text-lg font-semibold tracking-tight">
          Settings and activity
        </SheetTitle>

        <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          {signedIn ? (
            <>
              {/* Identity row */}
              {username && (
                <SheetClose asChild>
                  <Link
                    href={`/profile/${username}`}
                    className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/60"
                  >
                    <Avatar className="size-11">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{displayName || username}</p>
                      <p className="truncate text-xs text-muted-foreground">@{username}</p>
                    </div>
                  </Link>
                </SheetClose>
              )}

              {/* Accounts Center — the prominent grouped tile at the top */}
              <SheetClose asChild>
                <Link
                  href="/settings/account"
                  className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-3 hover:bg-secondary/70"
                >
                  <ShieldCheck className="size-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Accounts Center</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Password, security, personal details
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </SheetClose>

              <MenuSection label="Your activity">
                <MenuLink href="/trades" icon={Handshake} label="Trades" />
                <MenuLink href="/saved" icon={Bookmark} label="Saved" />
                <MenuLink href="/rewards" icon={Trophy} label="Rewards" />
                <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <MenuLink href="/profile/edit" icon={Pencil} label="Edit profile" />
              </MenuSection>

              <MenuSection label="Subscription">
                <MenuLink
                  href={isPaid ? "/pricing" : "/go-pro"}
                  icon={Sparkles}
                  label="Manage subscription"
                  trailing={<TierBadge tier={tier ?? "free"} />}
                />
              </MenuSection>

              <MenuSection label="Preferences">
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                  <span className="text-sm font-medium">Appearance</span>
                  <ThemeToggle />
                </div>
                <MenuLink href="/notifications" icon={Bell} label="Notifications" />
              </MenuSection>

              <MenuSection label="More info and support">
                <MenuLink href="/help" icon={HelpCircle} label="Help" />
                <MenuLink href="/about" icon={Info} label="About" />
                <MenuLink href="/legal" icon={FileText} label="Terms & Privacy" />
              </MenuSection>
            </>
          ) : (
            <MenuSection label="Account">
              <MenuLink href="/login" label="Sign in" />
              <MenuLink href="/signup" label="Sign up" />
            </MenuSection>
          )}
        </div>

        {/* Sign Out — pinned at the bottom; the only action that ends the session. */}
        {signedIn && (
          <div className="border-t border-border p-3">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  trailing,
}: {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-secondary/60")}
      >
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <span className="flex-1 font-medium">{label}</span>
        {trailing}
      </Link>
    </SheetClose>
  );
}
