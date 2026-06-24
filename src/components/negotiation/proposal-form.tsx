"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendFirstProposalAction,
  submitCounterAction,
  type NegotiationFormState,
} from "@/app/negotiations/actions";

type Initial = {
  owner_gives: string;
  seeker_gives: string;
  timeline_days: number | null;
  notes: string | null;
};

type Props = {
  ownerName: string;
  seekerName: string;
  initial: Initial;
} & (
  | { mode: "first"; interestId: string; onCancel?: () => void }
  | { mode: "counter"; negotiationId: string; expectedVersion: number; isOwner: boolean; onCancel?: () => void; onSuccess?: () => void }
);

export function ProposalForm(props: Props) {
  const action =
    props.mode === "first"
      ? sendFirstProposalAction.bind(null, props.interestId)
      : submitCounterAction.bind(null, props.negotiationId, props.expectedVersion);

  const [state, formAction] = useFormState<NegotiationFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  // In counter mode, only the current party can edit their own side.
  const ownerLocked = props.mode === "counter" && !props.isOwner;
  const seekerLocked = props.mode === "counter" && props.isOwner;

  if (state?.ok && props.mode === "counter" && props.onSuccess) {
    setTimeout(() => props.onSuccess?.(), 400);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className={`space-y-2 rounded-lg border p-4 ${ownerLocked ? "border-border/50 bg-muted/30" : "border-border bg-card"}`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {props.ownerName} gives
            {ownerLocked && <Lock className="size-3 opacity-50" />}
          </p>
          <Textarea
            name="owner_gives"
            rows={5}
            defaultValue={props.initial.owner_gives}
            placeholder="What the listing owner provides — scope, deliverables, dates."
            readOnly={ownerLocked}
            className={ownerLocked ? "cursor-not-allowed opacity-60 resize-none" : undefined}
          />
          {fe.owner_gives && <p className="text-xs text-destructive">{fe.owner_gives}</p>}
        </div>

        <div className={`space-y-2 rounded-lg border p-4 ${seekerLocked ? "border-border/50 bg-muted/30" : "border-border bg-card"}`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {props.seekerName} gives
            {seekerLocked && <Lock className="size-3 opacity-50" />}
          </p>
          <Textarea
            name="seeker_gives"
            rows={5}
            defaultValue={props.initial.seeker_gives}
            placeholder="What the seeker brings in return — scope, deliverables, dates."
            readOnly={seekerLocked}
            className={seekerLocked ? "cursor-not-allowed opacity-60 resize-none" : undefined}
          />
          {fe.seeker_gives && <p className="text-xs text-destructive">{fe.seeker_gives}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="timeline_days">Timeline (days)</Label>
          <Input
            id="timeline_days"
            name="timeline_days"
            type="number"
            min={1}
            max={365}
            defaultValue={props.initial.timeline_days ?? ""}
            placeholder="14"
          />
          {fe.timeline_days && <p className="text-xs text-destructive">{fe.timeline_days}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={props.initial.notes ?? ""}
            placeholder="Anything else to clarify the deal."
          />
          {fe.notes && <p className="text-xs text-destructive">{fe.notes}</p>}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {props.onCancel && (
          <Button type="button" variant="ghost" onClick={props.onCancel}>Cancel</Button>
        )}
        <SubmitButton mode={props.mode} />
      </div>
    </form>
  );
}

function SubmitButton({ mode }: { mode: "first" | "counter" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : mode === "first" ? "Send proposal" : "Submit counter-offer"}
    </Button>
  );
}
