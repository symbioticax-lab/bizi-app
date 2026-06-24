"use client";

import { useState } from "react";
import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Splits a negotiation thread into two focused views:
 *   - Deal  → proposal terms + action bar
 *   - Chat  → full-height message thread + composer
 *
 * Previously these were stacked on one long page, so the sticky proposal
 * panel scrolled over the chat. Tabbing them apart gives the chat its own
 * space and removes that conflict. Panels are conditionally rendered so the
 * chat re-mounts (and auto-scrolls to the latest message) each time it opens.
 */
export function ThreadTabs({
  deal,
  chat,
  defaultTab = "deal",
}: {
  deal: React.ReactNode;
  chat: React.ReactNode;
  defaultTab?: "deal" | "chat";
}) {
  const [tab, setTab] = useState<"deal" | "chat">(defaultTab);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-border bg-card/60 p-1">
        <TabButton active={tab === "deal"} onClick={() => setTab("deal")} icon={FileText} label="Deal" />
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="Chat" />
      </div>
      {tab === "deal" ? deal : chat}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
