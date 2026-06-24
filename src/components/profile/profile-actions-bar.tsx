import { ConnectButton, type ConnectStatus } from "@/components/people/connect-button";
import { FollowButton } from "@/components/people/follow-button";
import { TapButton } from "@/components/profile/tap-button";
import { cn } from "@/lib/utils";

type Props = {
  profileId: string;
  displayName: string;
  connectionStatus: ConnectStatus;
  isFollowing: boolean;
};

/**
 * Primary action strip rendered directly below the profile hero for visitors.
 * Connect + Follow share equal flex width; Tap + Bookmark are compact icon buttons.
 * This component is server-renderable — all client state lives inside the children.
 */
export function ProfileActionsBar({
  profileId,
  displayName,
  connectionStatus,
  isFollowing,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-3",
        "border-b border-white/[0.05]",
        "md:px-0 md:border-0",
      )}
    >
      {/* Primary actions — balanced flex-1 so they read as equals */}
      <div className="flex min-w-0 flex-1 gap-2">
        <div className="flex-1">
          <ConnectButton
            recipientId={profileId}
            displayName={displayName}
            status={connectionStatus}
          />
        </div>
        <div className="flex-1">
          <FollowButton followeeId={profileId} isFollowing={isFollowing} />
        </div>
      </div>

      {/* Tap — interest signal, unique to the action bar */}
      <TapButton
        targetType="profile"
        targetId={profileId}
        ownerId={profileId}
        variant="compact"
      />
    </div>
  );
}
