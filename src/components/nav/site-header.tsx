import Image from "next/image";
import Link from "next/link";
import { Bell, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAlertCounts } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { AlertsRealtime } from "@/components/realtime/alerts-realtime";
import { DesktopAccountPanel } from "@/components/nav/desktop-account-panel";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  let messageCount = 0;
  let profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    subscription_tier: string | null;
  } | null = null;

  if (user) {
    const [counts, profileRes] = await Promise.all([
      getAlertCounts(user.id),
      supabase
        .from("profiles")
        .select("username, display_name, avatar_url, subscription_tier")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    unreadCount = counts.total;
    messageCount = counts.messages;
    profile = profileRes.data ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      {user && <AlertsRealtime userId={user.id} />}
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" aria-label="BIZI home" className="flex shrink-0 items-center">
          <Image
            src="/bizi-logo.png"
            alt="BIZI"
            width={96}
            height={120}
            priority
            className="h-12 w-auto brightness-0 dark:invert"
          />
        </Link>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Messages icon — mobile only; sidebar covers desktop */}
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={messageCount > 0 ? `Messages (${messageCount} unread)` : "Messages"}
                className="relative lg:hidden"
              >
                <Link href="/messages">
                  <MessageSquare className="size-4" />
                  {messageCount > 0 && (
                    <span
                      aria-hidden
                      className="absolute right-1.5 top-1.5 inline-flex size-2 items-center justify-center rounded-full bg-primary ring-2 ring-background"
                    />
                  )}
                </Link>
              </Button>

              {/* Notifications bell — mobile only; sidebar covers desktop */}
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                className="relative lg:hidden"
              >
                <Link href="/notifications">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span
                      aria-hidden
                      className="absolute right-1.5 top-1.5 inline-flex size-2 items-center justify-center rounded-full bg-primary ring-2 ring-background"
                    />
                  )}
                </Link>
              </Button>

              {/* Desktop account panel — profile avatar triggers right-side sheet */}
              <DesktopAccountPanel
                username={profile?.username ?? null}
                displayName={profile?.display_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
                tier={(profile?.subscription_tier as SubscriptionTier) ?? null}
              />
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
