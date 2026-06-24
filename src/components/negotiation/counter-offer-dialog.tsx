"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProposalForm } from "./proposal-form";

type Props = {
  negotiationId: string;
  expectedVersion: number;
  ownerName: string;
  seekerName: string;
  isOwner: boolean;
  initial: {
    owner_gives: string;
    seeker_gives: string;
    timeline_days: number | null;
    notes: string | null;
  };
};

export function CounterOfferDialog({ negotiationId, expectedVersion, ownerName, seekerName, isOwner, initial }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Repeat className="size-4" /> Counter offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Send a counter-offer</DialogTitle>
          <DialogDescription>
            Adjust any of the terms — they'll see this as v{expectedVersion + 1} of the negotiation.
          </DialogDescription>
        </DialogHeader>
        <ProposalForm
          mode="counter"
          negotiationId={negotiationId}
          expectedVersion={expectedVersion}
          ownerName={ownerName}
          seekerName={seekerName}
          isOwner={isOwner}
          initial={initial}
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
