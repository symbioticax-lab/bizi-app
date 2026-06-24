import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TradeTabs } from "@/components/nav/trade-tabs";
import { createClient } from "@/lib/supabase/server";
import { initials, formatRelative } from "@/lib/utils";

const ACTIVE = ["proposal_sent", "counter_sent", "in_progress", "completed_by_owner", "completed_by_seeker"] as const;

export default async function NegotiationsListPage({ searchParams }: { searchParams: { filter?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/negotiations");

  const filter = searchParams.filter ?? "active";

  let query = supabase
    .from("negotiations")
    .select(`
      id, status, last_action_at, last_action_by, current_proposal_version,
      owner_id, seeker_id,
      opportunity:opportunities!inner(id, title),
      owner:profiles!negotiations_owner_id_fkey(id, username, display_name, avatar_url),
      seeker:profiles!negotiations_seeker_id_fkey(id, username, display_name, avatar_url)
    `)
    .or(`owner_id.eq.${user.id},seeker_id.eq.${user.id}`)
    .order("last_action_at", { ascending: false });

  if (filter === "active") query = query.in("status", ACTIVE as unknown as string[]);
  else if (filter === "completed") query = query.eq("status", "completed");
  else if (filter === "cancelled") query = query.in("status", ["cancelled", "expired_inactive"]);

  const { data: rows } = await query;

  type Row = {
    id: string;
    status: string;
    last_action_at: string;
    last_action_by: string | null;
    current_proposal_version: number;
    owner_id: string;
    seeker_id: string;
    opportunity: { id: string; title: string };
    owner: { id: string; username: string; display_name: string; avatar_url: string | null };
    seeker: { id: string; username: string; display_name: string; avatar_url: string | null };
  };
  const negotiations = (rows ?? []) as unknown as Row[];

  return (
    <>
      <TradeTabs />
      <div className="container max-w-3xl space-y-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Conversations moving toward (or away from) a deal.</p>
        <FilterTabs current={filter} />
      </header>

      {negotiations.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <ul className="space-y-2">
          {negotiations.map((n) => {
            const isOwner = n.owner_id === user.id;
            const counterpart = isOwner ? n.seeker : n.owner;
            const myTurn = n.last_action_by !== user.id && ["proposal_sent", "counter_sent"].includes(n.status);

            return (
              <li key={n.id}>
                <Link
                  href={`/negotiations/${n.id}`}
                  className="group flex items-start gap-3 rounded-xl border glass p-4 transition-colors hover:border-primary/40"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} alt="" />}
                    <AvatarFallback>{initials(counterpart.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="line-clamp-1 font-medium">{n.opportunity.title}</p>
                      {myTurn && <Badge>Your turn</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      with {counterpart.display_name} · {isOwner ? "You're the owner" : "You're the seeker"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {labelStatus(n.status)} · v{n.current_proposal_version} · {formatRelative(n.last_action_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </>
  );
}

function labelStatus(status: string): string {
  switch (status) {
    case "proposal_sent":       return "Proposal sent";
    case "counter_sent":        return "Counter sent";
    case "in_progress":         return "Trade in progress";
    case "completed_by_owner":  return "Owner completed";
    case "completed_by_seeker": return "Seeker completed";
    case "completed":           return "Completed";
    case "cancelled":           return "Cancelled";
    case "expired_inactive":    return "Expired";
    case "disputed":            return "Disputed";
    default:                    return status;
  }
}

function FilterTabs({ current }: { current: string }) {
  const tabs = [
    { id: "active",    label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];
  return (
    <nav className="flex gap-1 rounded-full border border-border bg-card p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/negotiations?filter=${t.id}`}
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
          {filter === "active" ? "No active negotiations" : filter === "completed" ? "No completed trades yet" : "Nothing here"}
        </p>
        <p className="text-sm text-muted-foreground">
          {filter === "active"
            ? "Express interest in a listing or send a proposal on one of yours to get started."
            : "Once trades wrap up, they'll show here."}
        </p>
        <Button asChild variant="outline"><Link href="/">Browse listings</Link></Button>
      </CardContent>
    </Card>
  );
}
