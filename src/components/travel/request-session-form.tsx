"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { requestSessionAction, type SessionFormState } from "@/app/travel/actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Request Session"}
    </Button>
  );
}

export function RequestSessionForm({
  tripId,
  beginDate,
  endDate,
  onSuccess,
  compact = false,
}: {
  tripId: string;
  beginDate: string;
  endDate: string;
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const action = requestSessionAction.bind(null, tripId);
  const [state, formAction] = useFormState<SessionFormState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok && onSuccess) onSuccess();
  }, [state?.ok, onSuccess]);

  const inner = (
    <div className="space-y-3">
      {state?.ok && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          Request sent! They&apos;ll be notified.
        </p>
      )}
      {state?.error && !Object.keys(fe).length && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <form action={formAction} className="space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="proposed_date">Date</Label>
          <Input
            id="proposed_date"
            name="proposed_date"
            type="date"
            required
            min={beginDate}
            max={endDate}
            style={{ colorScheme: "dark" }}
            className={cn(fe.proposed_date && "border-destructive")}
          />
          {fe.proposed_date && (
            <p className="text-xs text-destructive">{fe.proposed_date}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="session_message">
            Message
            <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="session_message"
            name="message"
            rows={2}
            maxLength={300}
            placeholder="What would you like to work on together?"
          />
        </div>

        <SubmitBtn />
      </form>
    </div>
  );

  if (compact) return inner;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CalendarDays className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Request a Session</h3>
          <p className="text-xs text-muted-foreground">Pick a date within their trip</p>
        </div>
      </div>
      {inner}
    </div>
  );
}
