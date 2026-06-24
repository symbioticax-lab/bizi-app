import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { initials, formatRelative } from "@/lib/utils";

export default async function TradesListPage({ searchParams }: { searchParams: { filter?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trades");

  const filter = searchParams.filter ?? "active";

  let query = supabase
    .from("trades")
    .select(`
      id, status, owner_completed_at, seeker_completed_at, completed_at, created_at,
      owner_id, seeker_id,
      negotiation:negotiations!inner(opportunity:opportunities!inner(id, title)),
      owner:profiles!trades_owner_id_fkey(id, username, display_name, avatar_url),
      seeker:profiles!trades_seeker_id_fkey(id, username, display_name, avatar_url)
    `)
    .or(`owner_id.eq.${user.id},seeker_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (filter === "active") query = query.in("status", ["in_progress", "completed_by_owner", "completed_by_seeker"]);
  else if (filter === "completed") query = query.eq("status", "completed");
  else if (filter === "disputed") query = query.in("status", ["disputed", "cancelled"]);

  const { data: rows } = await query;

  type Row = {
    id: string; status: string;
    owner_completed_at: string | null; seeker_completed_at: string | null;
    completed_at: string | null; created_at: string;
    owner_id: string; seeker_id: string;
    negotiation: { opportunity: { id: string; title: string } };
    owner: { id: string; username: string; display_name: string; avatar_url: string | null };
    seeker: { id: string; username: string; display_name: string; avatar_url: string | null };
  };
  const trades = (rows ?? []) as unknown as Row[];

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trades</h1>
          <p className="text-sm text-muted-foreground">Active and past exchanges.</p>
        </div>
        <FilterTabs current={filter} />
      </header>

      {trades.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <ul className="space-y-2">
          {trades.map((t) => {
            const isOwner = t.owner_id === user.id;
            const counterpart = isOwner ? t.seeker : t.owner;
            const myCompleted = isOwner ? t.owner_completed_at != null : t.seeker_completed_at != null;
            const theirCompleted = isOwner ? t.seeker_completed_at != null : t.owner_completed_at != null;
            const needsMyAction = t.status === "in_progress" || (t.status === "completed_by_owner" && !isOwner) || (t.status === "completed_by_seeker" && isOwner);

            return (
              <li key={t.id}>
                <Link
                  href={`/trades/${t.id}`}
                  className="group flex items-start gap-3 rounded-xl border glass p-4 transition-colors hover:border-primary/40"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} alt="" />}
                    <AvatarFallback>{initials(counterpart.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-1 font-medium">{t.negotiation.opportunity.title}</p>
                      {needsMyAction && t.status !== "completed" && <Badge>Action needed</Badge>}
                      {t.status === "completed" && <Badge variant="outline">Completed</Badge>}
                      {t.status === "disputed" && <Badge variant="muted">Disputed</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      with {counterpart.display_name} · {isOwner ? "You're the owner" : "You're the seeker"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {progressLabel(myCompleted, theirCompleted, t.status)} · started {formatRelative(t.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function progressLabel(mine: boolean, theirs: boolean, status: string): string {
  if (status === "completed") return "Both confirmed complete";
  if (status === "disputed") return "Disputed";
  if (status === "cancelled") return "Cancelled";
  if (mine && !theirs) return "You marked complete · waiting on them";
  if (!mine && theirs) return "They marked complete · your turn";
  return "Both pending";
}

function FilterTabs({ current }: { current: string }) {
  const tabs = [
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "disputed", label: "Disputed" },
  ];
  return (
    <nav className="flex gap-1 rounded-full border border-border bg-card p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/trades?filter=${t.id}`}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            current === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

function Empty({ filter }: { filter: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-10 text-center">
        <p className="text-base font-medium">
          {filter === "active" ? "No active trades yet" : filter === "completed" ? "No completed trades yet" : "Nothing here"}
        </p>
        <p className="text-sm text-muted-foreground">
          Trades start once both parties accept a proposal in a negotiation.
        </p>
        <Button asChild variant="outline"><Link href="/negotiations">View negotiations</Link></Button>
      </CardContent>
    </Card>
  );
}
