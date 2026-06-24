"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials, formatRelative } from "@/lib/utils";
import { declineInterestAction } from "@/app/interests/actions";

type Seeker = { id: string; username: string; display_name: string; avatar_url: string | null; rating_avg: number; review_count: number };

type Props = {
  interest: {
    id: string;
    message: string;
    offered_title: string;
    offered_desc: string;
    status: string;
    created_at: string;
  };
  seeker: Seeker;
  onSendProposalDisabledReason?: string;
};

export function InterestRow({ interest, seeker, onSendProposalDisabledReason }: Props) {
  const declined = interest.status === "declined";
  const withdrawn = interest.status === "withdrawn";
  const converted = interest.status === "converted";
  const closed = declined || withdrawn || converted;

  return (
    <li className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/profile/${seeker.username}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {seeker.avatar_url && <AvatarImage src={seeker.avatar_url} alt="" />}
            <AvatarFallback>{initials(seeker.display_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{seeker.display_name}</div>
            <div className="text-xs text-muted-foreground">
              @{seeker.username}
              {seeker.review_count > 0 && <> · {Number(seeker.rating_avg).toFixed(2)} ({seeker.review_count})</>}
              <> · {formatRelative(interest.created_at)}</>
            </div>
          </div>
        </Link>
        {closed ? (
          <Badge variant="muted" className="capitalize">{interest.status}</Badge>
        ) : interest.status === "seen" ? (
          <Badge variant="outline">Seen</Badge>
        ) : (
          <Badge>New</Badge>
        )}
      </div>

      <p className="whitespace-pre-line text-sm">{interest.message}</p>

      <div className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Offering</p>
        <p className="mt-1 font-medium">{interest.offered_title}</p>
        <p className="mt-1 text-muted-foreground whitespace-pre-line">{interest.offered_desc}</p>
      </div>

      {!closed && (
        <div className="flex flex-wrap gap-2">
          <Button
            asChild={!onSendProposalDisabledReason}
            disabled={Boolean(onSendProposalDisabledReason)}
            title={onSendProposalDisabledReason}
            size="sm"
          >
            {onSendProposalDisabledReason ? (
              <span>Send proposal</span>
            ) : (
              <Link href={`/interests/${interest.id}/propose`}>Send proposal</Link>
            )}
          </Button>
          <form action={declineInterestAction}>
            <input type="hidden" name="interest_id" value={interest.id} />
            <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              Decline
            </Button>
          </form>
        </div>
      )}
    </li>
  );
}
