import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

type Proposal = {
  id: string;
  version: number;
  proposed_by: string;
  owner_gives: string;
  seeker_gives: string;
  timeline_days: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type Props = {
  proposal: Proposal;
  ownerName: string;
  seekerName: string;
  proposerIsOwner: boolean;
  totalVersions: number;
};

export function ProposalPanel({ proposal, ownerName, seekerName, proposerIsOwner, totalVersions }: Props) {
  const proposerName = proposerIsOwner ? ownerName : seekerName;

  return (
    <section className="sticky top-14 z-30 -mx-4 border-y border-border bg-background/95 px-4 py-4 backdrop-blur md:mx-0 md:rounded-xl md:border">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current terms</p>
          <Badge variant="outline">v{proposal.version}{totalVersions > 1 ? ` of ${totalVersions}` : ""}</Badge>
          <ProposalStatusBadge status={proposal.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          From {proposerName} · {formatRelative(proposal.created_at)}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Term label={`${ownerName} gives`} body={proposal.owner_gives} />
        <Term label={`${seekerName} gives`} body={proposal.seeker_gives} />
      </div>

      {(proposal.timeline_days || proposal.notes) && (
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {proposal.timeline_days != null && (
            <div className="rounded-md border border-border/60 bg-card/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
              <p className="mt-1">{proposal.timeline_days} day{proposal.timeline_days === 1 ? "" : "s"}</p>
            </div>
          )}
          {proposal.notes && (
            <div className="rounded-md border border-border/60 bg-card/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-line">{proposal.notes}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Term({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm">{body}</p>
    </div>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":   return <Badge>Pending</Badge>;
    case "accepted":  return <Badge>Accepted</Badge>;
    case "countered": return <Badge variant="muted">Countered</Badge>;
    case "rejected":  return <Badge variant="muted">Rejected</Badge>;
    case "expired":   return <Badge variant="muted">Expired</Badge>;
    default:          return <Badge variant="outline">{status}</Badge>;
  }
}
