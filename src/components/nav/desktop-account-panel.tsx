"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { AccountPanelContent } from "./account-panel-content";

type Props = {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  tier?: SubscriptionTier | null;
};

export function DesktopAccountPanel({ username, displayName, avatarUrl, tier }: Props) {
  const [open, setOpen] = React.useState(false);
  const initials = (displayName || username || "?").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="hidden lg:flex items-center justify-center rounded-full ring-2 ring-border hover:ring-primary/50 transition-all"
          aria-label="Open account settings"
        >
          <Avatar className="size-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </SheetTrigger>
      <SheetContent onOpenChange={setOpen}>
        <SheetTitle className="px-4 pt-5 pb-3 text-lg font-semibold tracking-tight">
          Settings and activity
        </SheetTitle>
        <AccountPanelContent
          signedIn={true}
          username={username}
          displayName={displayName}
          avatarUrl={avatarUrl}
          tier={tier}
        />
      </SheetContent>
    </Sheet>
  );
}
