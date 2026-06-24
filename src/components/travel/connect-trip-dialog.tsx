"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { connectTripAction, type SessionFormState } from "@/app/travel/actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send Message"}
    </Button>
  );
}

export function ConnectTripDialog({
  tripId,
  travelerName,
  tripTitle,
  cityName,
  variant = "compact",
}: {
  tripId: string;
  travelerName: string;
  tripTitle: string | null;
  cityName: string;
  variant?: "compact" | "full";
}) {
  const [open, setOpen] = useState(false);
  const action = connectTripAction.bind(null, tripId);
  const [state, formAction] = useFormState<SessionFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  const contextLine = tripTitle
    ? `Re: "${tripTitle}" in ${cityName}`
    : `Re: trip to ${cityName}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "compact" ? (
          <button
            type="button"
            aria-label="Connect"
            className="inline-flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
          >
            <MessageSquare className="size-4" />
          </button>
        ) : (
          <Button variant="secondary" className="gap-2">
            <MessageSquare className="size-4" />
            Connect
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect with {travelerName}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {contextLine}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-1">
          {state?.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              Message sent!
            </p>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="connect-message">
              Message
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="connect-message"
              name="message"
              rows={3}
              maxLength={300}
              placeholder={`Hey! I saw your trip to ${cityName}…`}
            />
          </div>

          <SubmitBtn />
        </form>
      </DialogContent>
    </Dialog>
  );
}
