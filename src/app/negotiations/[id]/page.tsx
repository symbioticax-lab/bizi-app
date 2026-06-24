import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { ProposalPanel } from "@/components/negotiation/proposal-panel";
import { MessageThread } from "@/components/negotiation/message-thread";
import { MessageComposer } from "@/components/negotiation/message-composer";
import { ActionBar } from "@/components/negotiation/action-bar";
import { ThreadTabs } from "@/components/negotiation/thread-tabs";
import { NegotiationRealtime } from "@/components/realtime/negotiation-realtime";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

export default async function NegotiationThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/negotiations/${params.id}`);

  const { data: negotiation } = await supabase
    .from("negotiations")
    .select(`
      id, status, current_proposal_version, last_action_by, last_action_at,
      owner_id, seeker_id, opportunity_id, created_at,
      opportunity:opportunities!inner(id, title, status, negotiable),
      owner:profiles!negotiations_owner_id_fkey(id, username, display_name, avatar_url, rating_avg, review_count),
      seeker:profiles!negotiations_seeker_id_fkey(id, username, display_name, avatar_url, rating_avg, review_count)
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (!negotiation) notFound();

  const owner = negotiation.owner as unknown as {
    id: string; username: string; display_name: string; avatar_url: string | null; rating_avg: number; review_count: number;
  };
  const seeker = negotiation.seeker as unknown as {
    id: string; username: string; display_name: string; avatar_url: string | null; rating_avg: number; review_count: number;
  };
  const opportunity = negotiation.opportunity as unknown as {
    id: string; title: string; status: string; negotiable: boolean;
  };

  if (user.id !== owner.id && user.id !== seeker.id) notFound();

  const [{ data: proposals }, { data: messages }, { data: trade }] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, version, proposed_by, owner_gives, seeker_gives, timeline_days, notes, status, created_at")
      .eq("negotiation_id", negotiation.id)
      .order("version", { ascending: false }),
    supabase
      .from("messages")
      .select("id, sender_id, content, type, created_at, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)")
      .eq("negotiation_id", negotiation.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("trades")
      .select("id")
      .eq("negotiation_id", negotiation.id)
      .maybeSingle(),
  ]);

  const allProposals = (proposals ?? []) as Array<{
    id: string; version: number; proposed_by: string;
    owner_gives: string; seeker_gives: string;
    timeline_days: number | null; notes: string | null;
    status: string; created_at: string;
  }>;
  const currentProposal = allProposals[0];
  if (!currentProposal) notFound();

  const allMessages = (messages ?? []) as unknown as Array<{
    id: string; sender_id: string; content: string;
    type: "text" | "system" | "proposal_ref";
    created_at: string;
    sender: { id: string; display_name: string; avatar_url: string | null } | null;
  }>;

  const isOwner = user.id === owner.id;
  const counterpart = isOwner ? seeker : owner;
  const ownerProfile = { id: owner.id, display_name: owner.display_name, avatar_url: owner.avatar_url };
  const seekerProfile = { id: seeker.id, display_name: seeker.display_name, avatar_url: seeker.avatar_url };
  const tradeId = (trade as unknown as { id: string } | null)?.id ?? null;

  // Mark messages from the other party as read (fire-and-forget)
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("negotiation_id", negotiation.id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const messagingDisabled =
    negotiation.status === "cancelled" || negotiation.status === "expired_inactive";

  // Once the deal is struck the thread is mostly about coordination, so open
  // straight to Chat. While terms are still being negotiated, open to Deal.
  const chatDefault = [
    "both_accepted",
    "in_progress",
    "completed_by_owner",
    "completed_by_seeker",
    "completed",
  ].includes(negotiation.status);

  return (
    <div className="container max-w-4xl space-y-4 py-4">
      <NegotiationRealtime negotiationId={negotiation.id} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-1">
        <BackButton fallbackHref="/messages" />

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Link href={`/profile/${counterpart.username}`} className="shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-white/[0.07]">
              {counterpart.avatar_url && <AvatarImage src={counterpart.avatar_url} alt="" />}
              <AvatarFallback>{initials(counterpart.display_name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={`/profile/${counterpart.username}`}
              className="block truncate text-[15px] font-semibold leading-tight text-foreground hover:underline"
            >
              {counterpart.display_name}
            </Link>
            <Link
              href={`/opportunities/${opportunity.id}`}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-muted-foreground truncate"
            >
              <span className="truncate">{opportunity.title}</span>
              <ExternalLink className="size-3 shrink-0" />
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={negotiation.status} />
          {!opportunity.negotiable && <Badge variant="muted">Fixed</Badge>}
        </div>
      </header>

      {searchParams.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}

      {/* Deal terms + chat, split into focused tabs */}
      <ThreadTabs
        defaultTab={chatDefault ? "chat" : "deal"}
        deal={
          <div className="space-y-4">
            <ProposalPanel
              proposal={currentProposal}
              ownerName={owner.display_name}
              seekerName={seeker.display_name}
              proposerIsOwner={currentProposal.proposed_by === owner.id}
              totalVersions={allProposals.length}
            />
            <ActionBar
              negotiation={{
                id: negotiation.id,
                status: negotiation.status,
                current_proposal_version: negotiation.current_proposal_version,
                last_action_by: negotiation.last_action_by,
                owner_id: owner.id,
                seeker_id: seeker.id,
              }}
              currentProposal={currentProposal}
              currentUserId={user.id}
              ownerName={owner.display_name}
              seekerName={seeker.display_name}
              negotiable={opportunity.negotiable}
              tradeId={tradeId}
            />
          </div>
        }
        chat={
          <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="h-[60dvh] min-h-[20rem] overflow-y-auto">
              <MessageThread
                currentUserId={user.id}
                messages={allMessages}
                ownerProfile={ownerProfile}
                seekerProfile={seekerProfile}
              />
            </div>
            <div className="border-t border-white/[0.06]">
              <MessageComposer negotiationId={negotiation.id} disabled={messagingDisabled} />
            </div>
          </div>
        }
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "proposal_sent":         return <Badge>Proposal sent</Badge>;
    case "counter_sent":          return <Badge>Counter sent</Badge>;
    case "in_progress":           return <Badge>Trade in progress</Badge>;
    case "completed_by_owner":    return <Badge>Owner completed</Badge>;
    case "completed_by_seeker":   return <Badge>Seeker completed</Badge>;
    case "completed":             return <Badge>Completed</Badge>;
    case "cancelled":             return <Badge variant="muted">Cancelled</Badge>;
    case "expired_inactive":      return <Badge variant="muted">Expired</Badge>;
    case "disputed":              return <Badge variant="muted">Disputed</Badge>;
    default:                      return <Badge variant="outline">{status}</Badge>;
  }
}
