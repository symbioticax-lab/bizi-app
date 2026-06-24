"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTripAction } from "@/app/travel/actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="icon"
      variant="ghost"
      aria-label="Delete trip"
      disabled={pending}
      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const action = deleteTripAction.bind(null, tripId);
  return (
    <form action={action}>
      <DeleteButton />
    </form>
  );
}
