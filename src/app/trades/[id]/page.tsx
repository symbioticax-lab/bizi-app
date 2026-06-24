import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, Hourglass, Trophy, MessageSquare } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewCard } from "@/components/review/review-card";
import { TradeRealtime } from "@/components/realtime/trade-realtime";
import { DisputeDialog } from "@/components/trade/dispute-dialog";
import { createClient } from "@/lib/supabase/server";
import { initials, formatRelative } from "@/lib/utils";
import { markTradeCompleteAction } from "../actions";

export default async function TradeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/trades/${params.id}`);

  const { data: trade } = await supabase
    .from("trades")
    .select(`
      id, status, owner_completed_at, seeker_completed_at, completed_at,
      created_at, dispute_reason, disputed_by, owner_id, seeker_id, negotiation_id,
      negotiation:negotiations!inner(id, opportunity_id),
      final_proposal:proposals!trades_final_proposal_id_fkey(
        id, version, owner_gives, seeker_gives, timeline_days, notes
      ),
      owner:profiles!trades_owner_id_fkey(id, username, display_name, avatar_url),
      seeker:profiles!trades_seeker_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (!trade) notFound();

  const owner = trade.owner as unknown as { id: string; username: string; display_name: string; avatar_url: string | null };
  const seeker = trade.seeker as unknown as { id: string; username: string; display_name: string; avatar_url: string | null };
  const negotiation = trade.negotiation as unknown as { id: string; opportunity_id: string };
  const finalProposal = trade.final_proposal as unknown as {
    id: string; version: number; owner_gives: string; seeker_gives: string;
    timeline_days: number | null; notes: string | null;
  };

  if (user.id !== owner.id && user.id !== seeker.id) notFound();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title")
    .eq("id", negotiation.opportunity_id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, tags, created_at, reviewer_id, reviewer:profiles!reviews_reviewer_id_fkey(username, display_name, avatar_url)")
    .eq("trade_id", trade.id)
    .order("created_at", { ascending: false });

  type ReviewRow = {
    id: string; rating: number; comment: string | null; tags: string[]; created_at: string;
    reviewer_id: string;
    reviewer: { username: string; display_name: string; avatar_url: string | null };
  };
  const allReviews = (reviews ?? []) as unknown as ReviewRow[];

  const isOwner = user.id === owner.id;
  const me = isOwner ? owner : seeker;
  const counterpart = isOwner ? seeker : owner;
  const myCompleted = isOwner ? trade.owner_completed_at != null : trade.seeker_completed_at != null;
  const theirCompleted = isOwner ? trade.seeker_completed_at != null : trade.owner_completed_at != null;
  const isCompleted = trade.status === "completed";
  const isDisputed = trade.status === "disputed";
  const myReview = allReviews.find((r) => r.reviewer_id === user.id);
  const theirReview = allReviews.find((r) => r.reviewer_id === counterpart.id);

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <TradeRealtime tradeId={trade.id} />
      <BackButton fallbackHref="/trades" />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            {opportunity && (
              <Link href={`/opportunities/${opportunity.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                {opportunity.title}
              </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">
              Trade with {counterpart.display_name}
            </h1>
            <p className="text-xs text-muted-foreground">Started {formatRelative(trade.created_at)}</p>
          </div>
          <StatusBadge status={trade.status} />
        </div>
      </header>

      {searchParams.error && trade.status !== "completed" && trade.status !== "disputed" && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      {/* Final terms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Final terms · v{finalProposal.version}</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/negotiations/${negotiation.id}`}><MessageSquare className="size-4" /> Open thread</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border/60 bg-card/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{owner.display_name} gives</p>
            <p className="mt-1 whitespace-pre-line text-sm">{finalProposal.owner_gives}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-card/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{seeker.display_name} gives</p>
            <p className="mt-1 whitespace-pre-line text-sm">{finalProposal.seeker_gives}</p>
          </div>
          {finalProposal.timeline_days != null && (
            <div className="rounded-md border border-border/60 bg-card/50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
              <p className="mt-1 text-sm">{finalProposal.timeline_days} day{finalProposal.timeline_days === 1 ? "" : "s"}</p>
            </div>
          )}
          {finalProposal.notes && (
            <div className="rounded-md border border-border/60 bg-card/50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm">{finalProposal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion / dispute / state card */}
      {!isCompleted && !isDisputed && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <CompletionTile name={me.display_name} avatar={me.avatar_url} done={myCompleted} you />
              <CompletionTile name={counterpart.display_name} avatar={counterpart.avatar_url} done={theirCompleted} />
            </div>

            {!myCompleted ? (
              <form action={markTradeCompleteAction}>
                <input type="hidden" name="trade_id" value={trade.id} />
                <Button type="submit" className="w-full">
                  <Check className="size-4" /> Mark my side complete
                </Button>
              </form>
            ) : !theirCompleted ? (
              <p className="rounded-md border border-border bg-card/60 p-3 text-center text-sm text-muted-foreground">
                <Hourglass className="mr-1 inline size-4" />
                Waiting for {counterpart.display_name} to confirm completion.
              </p>
            ) : null}

            <div className="flex justify-end pt-1">
              <DisputeDialog tradeId={trade.id} />
            </div>
          </CardContent>
        </Card>
      )}

      {isDisputed && (
        <Card>
          <CardContent className="p-5 text-sm">
            <p className="font-medium">This trade is disputed.</p>
            {trade.dispute_reason && (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{trade.dispute_reason}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              An admin will review the trade context and reach out. No further action is needed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review section */}
      {isCompleted && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              <Trophy className="mr-1 inline size-4 text-primary" />
              Trade complete
            </CardTitle>
            <span className="text-xs text-muted-foreground">{trade.completed_at && formatRelative(trade.completed_at)}</span>
          </CardHeader>
          <CardContent className="space-y-5">
            {myReview ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your review</p>
                <ReviewCard review={myReview} reviewer={{ username: "you", display_name: "You", avatar_url: null }} />
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your turn to review</p>
                <ReviewForm tradeId={trade.id} revieweeName={counterpart.display_name} />
              </div>
            )}

            {theirReview && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {counterpart.display_name}'s review of you
                </p>
                <ReviewCard review={theirReview} reviewer={theirReview.reviewer} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "in_progress":           return <Badge>In progress</Badge>;
    case "completed_by_owner":    return <Badge>Owner completed</Badge>;
    case "completed_by_seeker":   return <Badge>Seeker completed</Badge>;
    case "completed":             return <Badge>Completed</Badge>;
    case "disputed":              return <Badge variant="muted">Disputed</Badge>;
    case "cancelled":             return <Badge variant="muted">Cancelled</Badge>;
    default:                      return <Badge variant="outline">{status}</Badge>;
  }
}

function CompletionTile({
  name, avatar, done, you,
}: {
  name: string; avatar: string | null; done: boolean; you?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${done ? "border-primary/40 bg-primary/5" : "border-border bg-card/40"}`}>
      <Avatar className="h-9 w-9">
        {avatar && <AvatarImage src={avatar} alt="" />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{you ? "You" : name}</p>
        <p className="text-xs text-muted-foreground">{done ? "Marked complete" : "Pending"}</p>
      </div>
      {done && <Check className="size-4 text-primary" />}
    </div>
  );
}
