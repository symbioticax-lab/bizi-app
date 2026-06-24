"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, MessageCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { createOrGetDMThreadAction } from "@/app/messages/actions";

type Connection = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export function AddDMButton({ connections }: { connections: Connection[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = connections.filter((c) =>
    !query.trim() ||
    c.display_name.toLowerCase().includes(query.toLowerCase()) ||
    c.username.toLowerCase().includes(query.toLowerCase()),
  );

  function openPicker() {
    setQuery("");
    setOpen(true);
  }

  function handleSelect(conn: Connection) {
    if (pending) return;
    setLoadingId(conn.id);
    startTransition(async () => {
      const result = await createOrGetDMThreadAction(conn.id);
      if ("threadId" in result) {
        setOpen(false);
        router.push(`/messages/dm/${result.threadId}`);
      }
      setLoadingId(null);
    });
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={openPicker}
        className="flex shrink-0 flex-col items-center gap-2"
        aria-label="Start a new direct message"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/25 transition-colors hover:border-white/40 hover:bg-white/[0.04]">
          <Plus className="size-5 text-muted-foreground/60" />
        </div>
        <p className="text-[11px] text-muted-foreground/50">New DM</p>
      </button>

      {/* Backdrop — intentionally not clickable to dismiss; use the X button */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
      )}

      {/* Sheet/modal — bottom sheet on mobile, centered modal on desktop */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-background",
          // Mobile: slide up from bottom
          "bottom-0 left-0 right-0 rounded-t-2xl border-t border-white/[0.08] max-h-[75dvh]",
          // Desktop/tablet: centered modal, constrained width
          "md:bottom-auto md:left-1/2 md:right-auto md:top-1/2",
          "md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md",
          "md:rounded-2xl md:border md:border-white/[0.08] md:max-h-[70dvh]",
          "transition-[transform,opacity] duration-300",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none md:translate-y-[-48%]",
        )}
      >
        {/* Handle + header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 text-muted-foreground" />
            <h2 className="text-[15px] font-semibold">New Direct Message</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex size-7 items-center justify-center rounded-full bg-white/[0.07] transition-colors hover:bg-white/[0.12]"
            aria-label="Close"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-5 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search connections…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Connection list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
              <p className="text-sm font-medium text-foreground/70">No connections yet</p>
              <p className="text-xs text-muted-foreground/60">
                Accept a connection request to start messaging.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground/50">
              No connections match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="pb-safe-bottom pb-6">
              {filtered.map((conn) => (
                <li key={conn.id}>
                  <button
                    onClick={() => handleSelect(conn)}
                    disabled={pending}
                    className={cn(
                      "flex w-full items-center gap-3.5 px-5 py-3.5 text-left",
                      "transition-colors hover:bg-white/[0.04] active:bg-white/[0.07]",
                      loadingId === conn.id && "opacity-60",
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0">
                      {conn.avatar_url && <AvatarImage src={conn.avatar_url} alt="" />}
                      <AvatarFallback>{initials(conn.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-snug">
                        {conn.display_name}
                      </p>
                      <p className="text-[13px] text-muted-foreground/60">
                        @{conn.username}
                      </p>
                    </div>
                    {loadingId === conn.id && (
                      <div className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
