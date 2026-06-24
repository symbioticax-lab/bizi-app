"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectButton, type ConnectStatus } from "@/components/people/connect-button";
import { FollowButton } from "@/components/people/follow-button";
import { initials } from "@/lib/utils";

type Props = {
  profileId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  connectionStatus: ConnectStatus;
  isFollowing: boolean;
};

/**
 * Static identity bar rendered directly above the profile hero image.
 * Sits right below the site header so Connect + Follow are immediately
 * visible the moment you land on the profile — no scrolling required.
 */
export function StickyProfileBar({
  profileId,
  displayName,
  username,
  avatarUrl,
  connectionStatus,
  isFollowing,
}: Props) {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-white/[0.05] bg-background/60 pl-4 pr-5 backdrop-blur-sm">
      {/* Identity */}
      <Avatar className="size-9 shrink-0 ring-[1.5px] ring-white/[0.1]">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="text-[11px]">{initials(displayName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold leading-tight text-white/95">
          {displayName}
        </p>
        <p className="mt-[2px] truncate text-[11px] leading-none text-white/38">
          @{username}
        </p>
      </div>

      {/* Primary actions — right-aligned, solid contrast so they read as CTAs */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="w-[100px]">
          <ConnectButton
            recipientId={profileId}
            displayName={displayName}
            status={connectionStatus}
            variant="solid"
          />
        </div>
        <div className="w-[100px]">
          <FollowButton followeeId={profileId} isFollowing={isFollowing} variant="teal" />
        </div>
      </div>
    </div>
  );
}
