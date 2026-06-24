"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { expressInterestAction, type InterestFormState } from "@/app/interests/actions";

export function ExpressInterestDialog({
  opportunityId,
  ownerName,
  wantTitle,
  triggerLabel = "Express interest",
}: {
  opportunityId: string;
  ownerName: string;
  wantTitle: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const action = expressInterestAction.bind(null, opportunityId);
  const [state, formAction] = useFormState<InterestFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  // Close after success on the next render.
  if (state?.ok && open) {
    setTimeout(() => setOpen(false), 600);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 shadow-[0_0_18px_-4px_rgba(251,146,60,0.7)] hover:shadow-[0_0_26px_-4px_rgba(251,146,60,0.9)] hover:brightness-110 active:scale-[0.98]">
          <Handshake className="size-4" /> {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Express interest</DialogTitle>
          <DialogDescription>
            Tell {ownerName} what you'd bring to the table. They're looking for: <span className="text-foreground">{wantTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea id="message" name="message" rows={4}
              placeholder="Why this trade makes sense for you, what your timing looks like…" />
            {fe.message && <p className="text-xs text-destructive">{fe.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="offered_title">What you're offering</Label>
            <Input id="offered_title" name="offered_title" placeholder="e.g. Email copy for a 4-part sequence" />
            {fe.offered_title && <p className="text-xs text-destructive">{fe.offered_title}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="offered_desc">Details on what you'll bring</Label>
            <Textarea id="offered_desc" name="offered_desc" rows={3}
              placeholder="Scope, timing, anything they'd need to know to say yes." />
            {fe.offered_desc && <p className="text-xs text-destructive">{fe.offered_desc}</p>}
          </div>

          {state?.error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
              Sent. {ownerName} will see it next time they open the listing.
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
  return <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send interest"}</Button>;
}
