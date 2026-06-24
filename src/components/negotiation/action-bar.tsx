import Link from "next/link";
import { Check, X, Trophy, Hourglass, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptProposalAction, cancelNegotiationAction } from "@/app/negotiations/actions";
import { CounterOfferDialog } from "./counter-offer-dialog";

type Negotiation = {
  id: string;
  status: string;
  current_proposal_version: number;
  last_action_by: string | null;
  owner_id: string;
  seeker_id: string;
};

type Proposal = {
  id: string;
  version: number;
  proposed_by: string;
  owner_gives: string;
  seeker_gives: string;
  timeline_days: number | null;
  notes: string | null;
};

type Props = {
  negotiation: Negotiation;
  currentProposal: Proposal;
  currentUserId: string;
  ownerName: string;
  seekerName: string;
  negotiable: boolean;
  tradeId: string | null;
};

export function ActionBar({
  negotiation,
  currentProposal,
  currentUserId,
  ownerName,
  seekerName,
  negotiable,
  tradeId,
}: Props) {
  const status = negotiation.status;

  // Terminal states first ----------------------------------------------------
  if (status === "cancelled") {
    return (
      <Banner icon={<Ban className="size-4" />} tone="muted">
        This negotiation was cancelled.
      </Banner>
    );
  }

  if (status === "expired_inactive") {
    return (
      <Banner icon={<Hourglass className="size-4" />} tone="muted">
        This negotiation expired from inactivity.
      </Banner>
    );
  }

  if (status === "in_progress" || status === "completed_by_owner" || status === "completed_by_seeker") {
    return (
      <Banner icon={<Trophy className="size-4" />} tone="primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Trade is in progress.</span>
          {tradeId && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/trades/${tradeId}`}>Open trade</Link>
            </Button>
          )}
        </div>
      </Banner>
    );
  }

  if (status === "completed") {
    return (
      <Banner icon={<Trophy className="size-4" />} tone="primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Trade complete — leave a review.</span>
          {tradeId && (
            <Button asChild size="sm">
              <Link href={`/trades/${tradeId}`}>Open trade</Link>
            </Button>
          )}
        </div>
      </Banner>
    );
  }

  // Active states: proposal_sent / counter_sent ------------------------------
  const myTurn = negotiation.last_action_by !== currentUserId;
  const counterpartName = currentUserId === negotiation.owner_id ? seekerName : ownerName;

  if (!myTurn) {
    return (
      <Banner icon={<Hourglass className="size-4" />} tone="muted">
        Waiting for {counterpartName} to respond…
      </Banner>
    );
  }

  // It's my turn: I can Accept, Counter (if negotiable), or Decline
  return (
    <div className="rounded-xl border glass p-4">
      <p className="mb-3 text-sm font-medium">
        Your move — {counterpartName} sent you {status === "counter_sent" ? "a counter-offer" : "a proposal"}.
      </p>
      <div className="flex flex-wrap gap-2">
        <form action={acceptProposalAction}>
          <input type="hidden" name="negotiation_id" value={negotiation.id} />
          <input type="hidden" name="proposal_id" value={currentProposal.id} />
          <Button type="submit"><Check className="size-4" /> Accept deal</Button>
        </form>

        {negotiable && (
          <CounterOfferDialog
            negotiationId={negotiation.id}
            expectedVersion={negotiation.current_proposal_version}
            ownerName={ownerName}
            seekerName={seekerName}
            isOwner={currentUserId === negotiation.owner_id}
            initial={{
              owner_gives: currentProposal.owner_gives,
              seeker_gives: currentProposal.seeker_gives,
              timeline_days: currentProposal.timeline_days,
              notes: currentProposal.notes,
            }}
          />
        )}

        <form action={cancelNegotiationAction}>
          <input type="hidden" name="negotiation_id" value={negotiation.id} />
          <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
            <X className="size-4" /> Decline
          </Button>
        </form>
      </div>

      {!negotiable && (
        <p className="mt-3 text-xs text-muted-foreground">
          The owner marked this listing as fixed terms — you can Accept or Decline, but counter-offers aren't allowed.
        </p>
      )}
    </div>
  );
}

function Banner({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "muted" | "primary";
  children: React.ReactNode;
}) {
  const cls =
    tone === "primary"
      ? "border-primary/40 bg-primary/10 text-foreground"
      : "glass text-muted-foreground";
  return (
    <div className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${cls}`}>
      <span className="shrink-0">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
