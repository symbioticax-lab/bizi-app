import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, ArrowLeftRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileItemsCard } from "@/components/profile/profile-items-card";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/login/actions";
import { initials, formatRelative } from "@/lib/utils";
import { notificationHref, notificationVerb } from "@/lib/notifications";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [
    { data: profile },
    { data: myListings },
    { count: activeOpps },
    { count: activeNegs },
    { count: completedTrades },
    { data: receivedInterests },
    { data: sentInterests },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("opportunities")
      .select("id, title, status, category, image_urls, created_at")
      .eq("owner_id", user.id)
      // Active management lives here. Drafts get their own section below.
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "active"),
    supabase
      .from("negotiations")
      .select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .in("status", ["proposal_sent", "counter_sent", "in_progress", "completed_by_owner", "completed_by_seeker"]),
    supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .eq("status", "completed"),
    supabase
      .from("interests")
      .select("id, status, created_at, opportunity:opportunities!inner(id, title, owner_id), seeker:profiles!interests_seeker_id_fkey(username, display_name)")
      .eq("opportunities.owner_id", user.id)
      .in("status", ["pending", "seen"])
      .order("created_at", { ascending: false })
      .limit(6),
    // sentInterests:
    supabase
      .from("interests")
      .select("id, status, created_at, opportunity:opportunities!inner(id, title)")
      .eq("seeker_id", user.id)
      .in("status", ["pending", "seen", "declined"])
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const [{ data: offerings }, { data: wants }, { data: activity }, { data: drafts }] = await Promise.all([
    supabase
      .from("offerings")
      .select("id, title, description, category, tags")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("wants")
      .select("id, title, description, category, tags")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, reference_id, body, read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("opportunities")
      .select("id, title, category, image_urls, created_at, status")
      .eq("owner_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  type ActivityRow = {
    id: string; type: string; reference_id: string | null; body: string;
    read: boolean; created_at: string;
    actor: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  };
  const recentActivity = (activity ?? []) as unknown as ActivityRow[];
  const offeringList = (offerings ?? []) as Array<{ id: string; title: string; description: string | null; category: string | null; tags: string[] }>;
  const wantList = (wants ?? []) as Array<{ id: string; title: string; description: string | null; category: string | null; tags: string[] }>;

  return (
    <div className="container space-y-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.display_name ? `Hi, ${profile.display_name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">Your trades at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/opportunities/new"><Plus className="size-4" /> New listing</Link></Button>
          <form action={logoutAction}><Button variant="outline" type="submit">Sign out</Button></form>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active listings" value={activeOpps ?? 0} />
        <Stat label="Active negotiations" value={activeNegs ?? 0} href="/negotiations" />
        <Stat label="Completed trades" value={completedTrades ?? 0} href="/trades" />
        <Stat
          label="Rating"
          value={profile?.rating_avg ? Number(profile.rating_avg).toFixed(2) : "—"}
          sub={profile?.review_count ? `${profile.review_count} reviews` : "no reviews yet"}
        />
      </section>

      {drafts && drafts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Drafts <span className="text-sm font-normal text-muted-foreground">({drafts.length})</span>
            </CardTitle>
            <span className="text-xs text-muted-foreground">Not yet published</span>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {d.image_urls?.[0] ? (
                      <Image src={d.image_urls[0]} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40">
                        <ArrowLeftRight className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/opportunities/${d.id}/edit`} className="line-clamp-1 font-medium hover:underline">
                      {d.title || "Untitled draft"}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {d.category && <><span>{d.category}</span><span>·</span></>}
                      <span>Saved {formatRelative(d.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild size="sm" variant="default"><Link href={`/opportunities/${d.id}/edit`}>Continue</Link></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your listings</CardTitle>
          <Button asChild size="sm" variant="ghost"><Link href="/opportunities/new"><Plus className="size-4" /> New</Link></Button>
        </CardHeader>
        <CardContent>
          {myListings && myListings.length > 0 ? (
            <ul className="divide-y divide-border">
              {myListings.map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {l.image_urls?.[0] ? (
                      <Image src={l.image_urls[0]} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40">
                        <ArrowLeftRight className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/opportunities/${l.id}`} className="line-clamp-1 font-medium hover:underline">{l.title}</Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{l.category}</span>
                      <span>·</span>
                      <span>{formatRelative(l.created_at)}</span>
                      {l.status !== "active" && <Badge variant="muted" className="ml-1">{l.status}</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild size="sm" variant="outline"><Link href={`/opportunities/${l.id}/edit`}>Edit</Link></Button>
                    <Button asChild size="sm" variant="ghost"><Link href={`/opportunities/${l.id}`}>View</Link></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint cta="Post your first listing" href="/opportunities/new" />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <ProfileItemsCard kind="offering" title="Your offerings" items={offeringList} manageable />
        <ProfileItemsCard kind="want" title="Your wants" items={wantList} manageable />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link href="/notifications" className="text-xs underline">All notifications</Link>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <ul className="space-y-2">
              {recentActivity.map((n) => {
                const href = notificationHref(n.type, n.reference_id);
                const verb = notificationVerb(n.type);
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary/30 ${
                        n.read ? "glass-subtle border-white/[0.04]" : "glass border-primary/30"
                      }`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {n.actor?.avatar_url && <AvatarImage src={n.actor.avatar_url} alt="" />}
                        <AvatarFallback>{initials(n.actor?.display_name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 text-sm">
                        <p>
                          <span className="font-medium">{n.actor?.display_name ?? "Someone"}</span>{" "}
                          <span>{verb}</span>{" "}
                          <span className="text-muted-foreground">{n.body}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                      </div>
                      {!n.read && <span aria-hidden className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-primary" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet — express interest in a listing or post one of your own.</p>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Interest received</CardTitle></CardHeader>
          <CardContent>
            {receivedInterests && receivedInterests.length > 0 ? (
              <ul className="divide-y divide-border">
                {receivedInterests.map((i) => {
                  const opp = i.opportunity as unknown as { id: string; title: string };
                  const seeker = i.seeker as unknown as { username: string; display_name: string };
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link href={`/opportunities/${opp.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                          {opp.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          From {seeker?.display_name ?? "@" + seeker?.username} · {formatRelative(i.created_at)}
                        </p>
                      </div>
                      {i.status === "pending" ? <Badge>New</Badge> : <Badge variant="outline">Seen</Badge>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No active interest yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Interest you sent</CardTitle></CardHeader>
          <CardContent>
            {sentInterests && sentInterests.length > 0 ? (
              <ul className="divide-y divide-border">
                {sentInterests.map((i) => {
                  const opp = i.opportunity as unknown as { id: string; title: string };
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <Link href={`/opportunities/${opp.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                          {opp.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatRelative(i.created_at)}</p>
                      </div>
                      <Badge variant={i.status === "declined" ? "muted" : i.status === "seen" ? "outline" : "default"} className="capitalize">
                        {i.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">You haven't expressed interest in anything yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {profile && (
        <Card>
          <CardHeader><CardTitle>Profile preview</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="muted">@{profile.username}</Badge>
              {profile.location && <Badge variant="outline">{profile.location}</Badge>}
              {profile.verified && <Badge>verified</Badge>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {profile.bio || "Tell people what you're great at — bio appears on your public profile."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm"><Link href={`/profile/${profile.username}`}>View public profile</Link></Button>
              <Button asChild size="sm"><Link href="/profile/edit">Edit profile</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: string; href?: string }) {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="rounded-xl border glass p-4 transition-colors hover:border-primary/40">
        {inner}
      </Link>
    );
  }
  return <div className="rounded-xl border glass p-4">{inner}</div>;
}

function EmptyHint({ cta, href }: { cta: string; href: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      Nothing here yet.
      <div className="mt-2"><Button asChild size="sm" variant="outline"><Link href={href}>{cta}</Link></Button></div>
    </div>
  );
}
