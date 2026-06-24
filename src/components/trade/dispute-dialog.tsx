"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { openDisputeAction, type DisputeFormState } from "@/app/trades/actions";

export function DisputeDialog({ tradeId }: { tradeId: string }) {
  const [open, setOpen] = useState(false);
  const action = openDisputeAction.bind(null, tradeId);
  const [state, formAction] = useFormState<DisputeFormState, FormData>(action, undefined);

  if (state?.ok && open) {
    setTimeout(() => setOpen(false), 600);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <AlertTriangle className="size-4" /> Open dispute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a dispute</DialogTitle>
          <DialogDescription>
            Use this only if something has gone seriously wrong with the trade. An admin will
            review the full negotiation context and reach out to both parties. Disputes lock the
            trade until resolved.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="reason">What happened? (100+ characters)</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={6}
              placeholder="Explain what went wrong, what you've tried, and what outcome you're hoping for."
            />
          </div>

          {state?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
              Dispute opened. An admin will be in touch.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Submitting…" : "Open dispute"}</Button>;
}
