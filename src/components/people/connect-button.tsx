"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { cn } from "@/lib/utils";
import { sendConnectionRequestAction } from "@/app/connections/actions";

export type ConnectStatus = "none" | "pending_sent" | "pending_received" | "connected";

export function ConnectButton({
  recipientId,
  displayName,
  status: initialStatus,
  variant = "ghost",
}: {
  recipientId: string;
  displayName: string;
  status: ConnectStatus;
  variant?: "ghost" | "solid";
}) {
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [status, setStatus] = useState<ConnectStatus>(initialStatus);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTrigger(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendConnectionRequestAction(fd);
      if ("error" in result) {
        // Hitting the monthly free limit → swap the composer for the paywall modal.
        if (result.upgrade) {
          setOpen(false);
          setShowUpgrade(true);
        } else {
          setError(result.error);
        }
      } else {
        setOpen(false);
        setStatus("pending_sent");
        setNote("");
      }
    });
  }

  if (status === "connected") {
    return (
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex items-center justify-center gap-[5px] rounded-[10px] border border-primary/25 bg-primary/15 py-[7px] text-[11.5px] font-medium leading-none text-primary/80"
      >
        <Check className="size-[11px]" />
        Connected
      </div>
    );
  }

  if (status === "pending_sent" || status === "pending_received") {
    return (
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="flex items-center justify-center gap-[5px] rounded-[10px] border border-border/40 dark:border-white/[0.05] bg-secondary/30 dark:bg-white/[0.03] py-[7px] text-[11.5px] font-medium leading-none text-muted-foreground dark:text-white/30"
      >
        <Clock className="size-[11px]" />
        Pending
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        className={cn(
          "flex w-full items-center justify-center gap-2",
          "rounded-[10px] py-[7px]",
          "text-[11.5px] font-medium leading-none tracking-[0.005em]",
          "transition-all duration-[220ms]",
          variant === "solid"
            ? [
                "bg-primary text-primary-foreground",
                "shadow-[0_0_14px_-4px_hsl(var(--primary)/0.5)]",
                "hover:bg-primary/90 hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.65)]",
              ]
            : [
                "border border-border dark:border-white/[0.07] bg-secondary/50 dark:bg-white/[0.05] backdrop-blur-sm text-foreground/70 dark:text-white/55",
                "hover:border-border/80 dark:hover:border-white/[0.14] hover:bg-secondary dark:hover:bg-white/[0.10] hover:text-foreground dark:hover:text-white/85",
              ],
        )}
      >
        Connect
        <Plus className={cn(
          "size-[11px] transition-colors duration-[220ms]",
          variant === "solid" ? "text-primary-foreground/70" : "text-muted-foreground/50 dark:text-white/40",
        )} />
      </button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent
          className="max-w-md"
          // Only close on an intentional action (X button or Escape). Clicks or
          // focus shifts outside the dialog must NOT dismiss it — otherwise the
          // composer vanishes mid-typing on desktop/tablet.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          // Stop clicks inside the modal from bubbling to an ancestor <Link>
          // (person cards wrap the whole tile in a profile link).
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Connect with {displayName}</DialogTitle>
            <DialogDescription>
              Add a note — let them know why you want to connect.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <input type="hidden" name="recipientId" value={recipientId} />
            <textarea
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={180}
              rows={4}
              autoFocus
              placeholder={`Hey ${displayName}, I'd love to connect…`}
              className={cn(
                "w-full resize-none rounded-xl border border-border dark:border-white/[0.09] bg-background dark:bg-white/[0.04]",
                "px-4 py-3 text-sm text-foreground dark:text-white/90 placeholder:text-muted-foreground dark:placeholder:text-white/25",
                "focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20",
              )}
            />
            <div className="mb-4 mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground/50">{note.length}/180</span>
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Send Request"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly free-limit paywall — same modal pattern used across the app. */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="You've used all 5 free connection requests this month"
        description="Free accounts can send 5 connection requests per month. Upgrade to Bizi Plus for unlimited connection requests and premium visibility across BIZI."
      />
    </>
  );
}
