import Image from "next/image";
import Link from "next/link";
import { Bell, MessageSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAlertCounts } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { AlertsRealtime } from "@/components/realtime/alerts-realtime";

export async function SiteHeader() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let unreadCount = 0;
  let messageCount = 0;
  if (user) {
    const counts = await getAlertCounts(user.id);
    unreadCount = counts.total;
    messageCount = counts.messages;
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
            className="h-12 w-auto brightness-0 invert"
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          <Link href="/" className="hover:text-foreground">Discover</Link>
          {user && <Link href="/negotiations" className="hover:text-foreground">Matches</Link>}
          {user && <Link href="/messages" className="hover:text-foreground">Messages</Link>}
          {user && <Link href="/saved" className="hover:text-foreground">Saved</Link>}
          {user && <Link href="/rewards" className="hover:text-foreground">Rewards</Link>}
          {user && <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Desktop-only Post button */}
              <Button asChild size="sm" variant="default" className="hidden lg:inline-flex">
                <Link href="/opportunities/new"><Plus className="size-4" /> Post</Link>
              </Button>

              {/* Messages icon — visible on mobile + desktop */}
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={messageCount > 0 ? `Messages (${messageCount} unread)` : "Messages"}
                className="relative"
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

              {/* Notifications bell — visible on mobile + desktop */}
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                className="relative"
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

            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost"><Link href="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link href="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
