import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Plane, UserPlus, UserPlus2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertsTabsServer } from "@/components/nav/alerts-tabs-server";
import { createClient } from "@/lib/supabase/server";
import { cn, initials, formatRelative } from "@/lib/utils";
import { notificationHref, notificationVerb, notificationCategory } from "@/lib/notifications";
import { markAllNotificationsReadAction, openNotificationAction, respondConnectionAction } from "./actions";

type Actor = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Notif = {
  id: string;
  type: string;
  reference_id: string | null;
  body: string;
  read: boolean;
  created_at: string;
  actor: Actor | null;
};

type PendingRequest = {
  id: string;
  note: string | null;
  created_at: string;
  requester: Actor;
};

const TRAVEL_TYPES = ["session_request", "session_accepted", "session_declined"];

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const [notifRes, requestsRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, reference_id, body, read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("connections")
      .select("id, note, created_at, requester:profiles!connections_requester_id_fkey(id, username, display_name, avatar_url)")
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const notifications = (notifRes.data ?? []) as unknown as Notif[];
  const pendingRequests = (requestsRes.data ?? []) as unknown as PendingRequest[];

  const { titles: titleByRef, hrefs: hrefByRef } = await resolveTargetTitles(supabase, notifications);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      <AlertsTabsServer />
      <div className="container max-w-2xl space-y-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Activity on your listings, trades, reviews, and travel.
          </p>
          {hasUnread && (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="ghost" size="sm">Mark all read</Button>
            </form>
          )}
        </header>

        {pendingRequests.length > 0 && (
          <RequestsSection requests={pendingRequests} />
        )}

        {notifications.length > 0 ? (
          <ul className="space-y-2">
            {notifications.map((n) => {
              if (n.type === "connection_request") {
                return <ConnectionRequestRow key={n.id} n={n} />;
              }
              if (n.type === "connection_accepted") {
                return <ConnectionAcceptedRow key={n.id} n={n} />;
              }
              if (n.type === "user_followed") {
                return <FollowRow key={n.id} n={n} />;
              }
              return (
                <NotificationRow
                  key={n.id}
                  n={n}
                  title={titleByRef.get(n.reference_id ?? "") ?? null}
                  hrefOverride={hrefByRef.get(n.reference_id ?? "") ?? null}
                />
              );
            })}
          </ul>
        ) : (
          pendingRequests.length === 0 && <EmptyState />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Requests section — pinned at top, fetched directly from connections table
// ---------------------------------------------------------------------------

function RequestsSection({ requests }: { requests: PendingRequest[] }) {
  return (
    <section
      aria-label="Connection Requests"
      className="overflow-hidden rounded-xl border border-indigo-500/25 bg-indigo-500/5"
    >
      <div className="flex items-center gap-2 border-b border-indigo-500/15 px-4 py-3">
        <UserPlus2 className="size-4 shrink-0 text-indigo-400" />
        <h2 className="text-sm font-semibold text-indigo-300">Connection Requests</h2>
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[11px] font-bold text-white">
          {requests.length}
        </span>
      </div>
      <ul className="divide-y divide-indigo-500/10">
        {requests.map((req) => (
          <RequestCard key={req.id} req={req} />
        ))}
      </ul>
    </section>
  );
}

function RequestCard({ req }: { req: PendingRequest }) {
  const { requester } = req;
  return (
    <li className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          {requester.avatar_url && <AvatarImage src={requester.avatar_url} alt="" />}
          <AvatarFallback>{initials(requester.display_name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <Link
              href={`/profile/${requester.username}`}
              className="text-sm font-semibold hover:underline"
            >
              {requester.display_name}
            </Link>
            <span className="text-xs text-muted-foreground">
              @{requester.username}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatRelative(req.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-foreground/80">
            wants to connect with you
          </p>

          {req.note && (
            <blockquote className="mt-2 border-l-2 border-indigo-400/50 pl-3 text-sm italic text-muted-foreground">
              &ldquo;{req.note}&rdquo;
            </blockquote>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <form action={respondConnectionAction} className="flex-1">
          <input type="hidden" name="connectionId" value={req.id} />
          <input type="hidden" name="response" value="accepted" />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700"
          >
            Accept
          </button>
        </form>
        <form action={respondConnectionAction} className="flex-1">
          <input type="hidden" name="connectionId" value={req.id} />
          <input type="hidden" name="response" value="declined" />
          <button
            type="submit"
            className="w-full rounded-lg border border-white/10 bg-white/[0.05] py-2.5 text-sm font-medium text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white/70"
          >
            Decline
          </button>
        </form>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Notification feed rows
// ---------------------------------------------------------------------------

function NotificationRow({
  n,
  title,
  hrefOverride,
}: {
  n: Notif;
  title: string | null;
  hrefOverride: string | null;
}) {
  const href = hrefOverride ?? notificationHref(n.type, n.reference_id);
  const verb = notificationVerb(n.type);
  const actor = n.actor;
  const isTravel = notificationCategory(n.type) === "travel";

  return (
    <li>
      <form action={openNotificationAction}>
        <input type="hidden" name="id" value={n.id} />
        <input type="hidden" name="href" value={href} />
        <button
          type="submit"
          className={[
            "group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
            "border-l-4",
            isTravel
              ? n.read
                ? "glass-subtle border-white/[0.04] border-l-amber-500/40"
                : "bg-amber-500/5 border-amber-500/25 border-l-amber-500 hover:border-amber-500/40"
              : n.read
                ? "glass-subtle border-white/[0.04] border-l-white/[0.04]"
                : "glass border-primary/30 border-l-primary/60 hover:border-primary/40",
          ].join(" ")}
        >
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              {actor?.avatar_url && <AvatarImage src={actor.avatar_url} alt="" />}
              <AvatarFallback>{initials(actor?.display_name ?? "?")}</AvatarFallback>
            </Avatar>
            {isTravel && (
              <span
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-background"
              >
                <Plane className="size-2.5 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              {actor ? (
                <span className="font-medium">{actor.display_name}</span>
              ) : (
                <span className="text-muted-foreground">Someone</span>
              )}{" "}
              <span className="text-foreground/90">{verb}</span>{" "}
              {title ? (
                <span className="font-medium">{title}</span>
              ) : (
                <span className="text-muted-foreground italic">[removed]</span>
              )}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {actor && <>@{actor.username} · </>}
                {formatRelative(n.created_at)}
              </p>
              {isTravel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-400">
                  <Plane className="size-2.5" />
                  Travel
                </span>
              )}
            </div>
          </div>

          {!n.read && (
            <span
              aria-label="unread"
              className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${
                isTravel ? "bg-amber-400" : "bg-primary"
              }`}
            />
          )}
        </button>
      </form>
    </li>
  );
}

// Read-only record that a request was received — actions are handled in the
// Requests section above, so no accept/decline buttons here.
function ConnectionRequestRow({ n }: { n: Notif }) {
  const actor = n.actor;
  return (
    <li>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-l-4 p-4",
          n.read
            ? "glass-subtle border-white/[0.04] border-l-indigo-500/40"
            : "border-indigo-500/25 border-l-indigo-500 bg-indigo-500/5",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            {actor?.avatar_url && <AvatarImage src={actor.avatar_url} alt="" />}
            <AvatarFallback>{initials(actor?.display_name ?? "?")}</AvatarFallback>
          </Avatar>
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-background"
          >
            <UserPlus2 className="size-2.5 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            {actor ? (
              <Link
                href={`/profile/${actor.username}`}
                className="font-medium hover:underline"
              >
                {actor.display_name}
              </Link>
            ) : (
              <span className="text-muted-foreground">Someone</span>
            )}{" "}
            <span className="text-foreground/90">sent you a connection request</span>
          </p>
          {n.body && (
            <p className="mt-1 text-sm italic text-muted-foreground">&ldquo;{n.body}&rdquo;</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {actor && <>@{actor.username} · </>}
              {formatRelative(n.created_at)}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-1.5 py-px text-[10px] font-semibold text-indigo-400">
              <UserPlus2 className="size-2.5" />
              Connection
            </span>
          </div>
        </div>

        {!n.read && (
          <span aria-label="unread" className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-indigo-400" />
        )}
      </div>
    </li>
  );
}

function ConnectionAcceptedRow({ n }: { n: Notif }) {
  const actor = n.actor;
  return (
    <li>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-l-4 p-4",
          n.read
            ? "glass-subtle border-white/[0.04] border-l-emerald-500/40"
            : "border-emerald-500/25 border-l-emerald-500 bg-emerald-500/5",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            {actor?.avatar_url && <AvatarImage src={actor.avatar_url} alt="" />}
            <AvatarFallback>{initials(actor?.display_name ?? "?")}</AvatarFallback>
          </Avatar>
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background"
          >
            <Check className="size-2.5 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            {actor ? (
              <Link
                href={`/profile/${actor.username}`}
                className="font-medium hover:underline"
              >
                {actor.display_name}
              </Link>
            ) : (
              <span className="text-muted-foreground">Someone</span>
            )}{" "}
            <span className="text-foreground/90">accepted your connection request</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {actor && <>@{actor.username} · </>}
              {formatRelative(n.created_at)}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-px text-[10px] font-semibold text-emerald-400">
              <Check className="size-2.5" />
              Connected
            </span>
          </div>
        </div>

        {!n.read && (
          <span aria-label="unread" className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-emerald-400" />
        )}
      </div>
    </li>
  );
}

function FollowRow({ n }: { n: Notif }) {
  const actor = n.actor;
  const href = actor ? `/profile/${actor.username}` : "/notifications";
  return (
    <li>
      <form action={openNotificationAction}>
        <input type="hidden" name="id" value={n.id} />
        <input type="hidden" name="href" value={href} />
        <button
          type="submit"
          className={cn(
            "group flex w-full items-start gap-3 rounded-xl border border-l-4 p-4 text-left transition-colors",
            n.read
              ? "glass-subtle border-white/[0.04] border-l-teal-500/40"
              : "border-teal-500/25 border-l-teal-500 bg-teal-500/5 hover:border-teal-500/40",
          )}
        >
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              {actor?.avatar_url && <AvatarImage src={actor.avatar_url} alt="" />}
              <AvatarFallback>{initials(actor?.display_name ?? "?")}</AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-teal-500 ring-2 ring-background"
            >
              <UserPlus className="size-2.5 text-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              {actor ? (
                <span className="font-medium">{actor.display_name}</span>
              ) : (
                <span className="text-muted-foreground">Someone</span>
              )}{" "}
              <span className="text-foreground/90">started following you</span>
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {actor && <>@{actor.username} · </>}
                {formatRelative(n.created_at)}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-1.5 py-px text-[10px] font-semibold text-teal-400">
                <UserPlus className="size-2.5" />
                Follow
              </span>
            </div>
          </div>

          {!n.read && (
            <span aria-label="unread" className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-teal-400" />
          )}
        </button>
      </form>
    </li>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-10 text-center">
        <p className="text-base font-medium">No notifications yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Activity on your listings, trades, and travel will show up here.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/">Browse listings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Batch-resolve the human-readable "target title" for each notification.
 * Also builds href overrides for trip notifications so they link directly
 * to the trip detail page instead of the generic travelogue.
 */
async function resolveTargetTitles(
  supabase: ReturnType<typeof createClient>,
  notifications: Notif[],
): Promise<{ titles: Map<string, string>; hrefs: Map<string, string> }> {
  const oppRefs: string[] = [];
  const negRefs: string[] = [];
  const tradeRefs: string[] = [];
  const tripRefs: string[] = [];

  for (const n of notifications) {
    if (!n.reference_id) continue;
    if (n.type === "interest_received" || n.type === "interest_declined" || n.type === "interest_withdrawn") {
      oppRefs.push(n.reference_id);
    } else if (n.type === "proposal_sent" || n.type === "counter_sent") {
      negRefs.push(n.reference_id);
    } else if (n.type === "both_accepted" || n.type === "trade_completed" || n.type === "review_received") {
      tradeRefs.push(n.reference_id);
    } else if (TRAVEL_TYPES.includes(n.type)) {
      tripRefs.push(n.reference_id);
    }
  }

  const titles = new Map<string, string>();
  const hrefs  = new Map<string, string>();

  if (oppRefs.length > 0) {
    const { data } = await supabase.from("opportunities").select("id, title").in("id", oppRefs);
    for (const row of data ?? []) titles.set(row.id, row.title);
  }

  if (negRefs.length > 0) {
    const { data } = await supabase
      .from("negotiations")
      .select("id, opportunity:opportunities!inner(title)")
      .in("id", negRefs);
    for (const row of data ?? []) {
      const title = (row.opportunity as unknown as { title: string } | null)?.title;
      if (title) titles.set(row.id, title);
    }
  }

  if (tradeRefs.length > 0) {
    const { data } = await supabase
      .from("trades")
      .select("id, negotiation:negotiations!inner(opportunity:opportunities!inner(title))")
      .in("id", tradeRefs);
    for (const row of data ?? []) {
      const title = ((row.negotiation as unknown) as { opportunity: { title: string } | null } | null)?.opportunity?.title;
      if (title) titles.set(row.id, title);
    }
  }

  if (tripRefs.length > 0) {
    const { data } = await supabase
      .from("trips")
      .select("id, title, destination")
      .in("id", tripRefs);
    for (const row of data ?? []) {
      const label = (row as { title?: string | null; destination: string }).title
        || (row as { destination: string }).destination;
      titles.set(row.id, label);
      hrefs.set(row.id, `/travel/${(row as { destination: string }).destination}/${row.id}`);
    }
  }

  return { titles, hrefs };
}
