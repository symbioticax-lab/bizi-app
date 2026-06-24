"use client";

import { useState, useTransition } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { followUserAction, unfollowUserAction } from "@/app/follows/actions";

export function FollowButton({
  followeeId,
  isFollowing: initialFollowing = false,
  variant = "ghost",
}: {
  followeeId: string;
  isFollowing?: boolean;
  variant?: "ghost" | "teal";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const optimistic = !following;
    setFollowing(optimistic);
    const fd = new FormData();
    fd.set("followeeId", followeeId);
    startTransition(async () => {
      const result = optimistic
        ? await followUserAction(fd)
        : await unfollowUserAction(fd);
      if ("error" in result) {
        setFollowing(!optimistic); // revert on failure
      }
    });
  }

  if (following) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex w-full items-center justify-center gap-2",
          "rounded-[10px] border border-teal-500/30 bg-teal-500/15 py-[7px]",
          "text-[11.5px] font-medium leading-none text-teal-400",
          "transition-all duration-[220ms]",
          "hover:border-teal-500/50 hover:bg-teal-500/25",
          "disabled:opacity-50",
        )}
      >
        <UserCheck className="size-[11px]" />
        Following
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex w-full items-center justify-center gap-2",
        "rounded-[10px] py-[7px]",
        "text-[11.5px] font-medium leading-none tracking-[0.005em]",
        "transition-all duration-[220ms]",
        "disabled:opacity-50",
        variant === "teal"
          ? [
              "border border-teal-500/35 bg-teal-500/10 text-teal-400",
              "hover:border-teal-500/55 hover:bg-teal-500/20 hover:text-teal-300",
            ]
          : [
              "border border-border dark:border-white/[0.07] bg-secondary/50 dark:bg-white/[0.05] backdrop-blur-sm text-foreground/70 dark:text-white/55",
              "hover:border-border/80 dark:hover:border-white/[0.14] hover:bg-secondary dark:hover:bg-white/[0.10] hover:text-foreground dark:hover:text-white/85",
            ],
      )}
    >
      <UserPlus className="size-[11px]" />
      Follow
    </button>
  );
}
