"use client";

import Link from "next/link";
import { Pencil, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setOpportunityStatusAction, deleteOpportunityAction } from "@/app/opportunities/actions";

export function OwnerControls({
  id,
  status,
  hasActiveNegotiation,
}: {
  id: string;
  status: string;
  hasActiveNegotiation: boolean;
}) {
  const isPaused = status === "paused";
  const nextStatus = isPaused ? "active" : "paused";

  function confirmDelete(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm("Delete this listing? This can't be undone.")) e.preventDefault();
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card/50 p-3 text-xs text-muted-foreground">
        This is your listing. {hasActiveNegotiation && "Editing is locked while a negotiation is active."}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" disabled={hasActiveNegotiation}>
          <Link href={hasActiveNegotiation ? "#" : `/opportunities/${id}/edit`} aria-disabled={hasActiveNegotiation}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>

        <form action={setOpportunityStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button type="submit" variant="outline" size="sm">
            {isPaused ? <><Play className="size-4" /> Resume</> : <><Pause className="size-4" /> Pause</>}
          </Button>
        </form>

        <form action={deleteOpportunityAction} onSubmit={confirmDelete}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
