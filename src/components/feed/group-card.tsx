"use client";

import { Star } from "lucide-react";
import { StatusBadge } from "@/components/feed/status-badge";
import type { BadgeStatus } from "@/components/feed/status-badge";

type GroupCardData = {
  name: string;
  memberCount: string;
  tags: string[];
  status?: BadgeStatus;
  distance?: string;
};

export function GroupCard({ group }: { group: GroupCardData }) {
  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-xl cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
      {/* Gradient background (no image needed for groups) */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-indigo-950" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />

      {/* Top row */}
      <div className="absolute left-2 top-2 z-10">
        {group.status && <StatusBadge status={group.status} />}
      </div>
      {group.distance && (
        <div className="absolute right-2 top-2 z-10 text-[11px] font-medium text-white/80">
          {group.distance}
        </div>
      )}

      {/* Save icon */}
      <button
        aria-label="Save group"
        className="absolute right-2 top-8 z-20 rounded-full bg-black/30 p-1 transition-colors hover:bg-black/50"
        onClick={(e) => e.preventDefault()}
      >
        <Star className="size-3.5 text-white/60 hover:text-[hsl(var(--status-gold))] transition-colors" />
      </button>

      {/* Decorative inner rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="size-16 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30" />
      </div>

      {/* Bottom gradient scrim */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3 z-10">
        <p className="font-semibold text-white text-sm line-clamp-1">{group.name}</p>
        <p className="text-white/55 text-[11px] mt-0.5">{group.memberCount} members</p>
        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {group.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
