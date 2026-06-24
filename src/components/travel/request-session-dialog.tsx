"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RequestSessionForm } from "@/components/travel/request-session-form";

export function RequestSessionDialog({
  tripId,
  beginDate,
  endDate,
  travelerName,
  cityName,
  variant = "compact",
}: {
  tripId: string;
  beginDate: string;
  endDate: string;
  travelerName: string;
  cityName: string;
  variant?: "compact" | "full";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "compact" ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <CalendarDays className="size-3.5" />
            Request a Session
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            <CalendarDays className="size-4" />
            Request a Session
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request a Session</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            with {travelerName} · {cityName}
          </DialogDescription>
        </DialogHeader>

        <RequestSessionForm
          tripId={tripId}
          beginDate={beginDate}
          endDate={endDate}
          onSuccess={() => setOpen(false)}
          compact
        />
      </DialogContent>
    </Dialog>
  );
}
