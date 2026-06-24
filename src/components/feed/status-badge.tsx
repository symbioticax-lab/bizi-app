import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeStatus = "online" | "new" | "trending" | "popular";

type Props = {
  status: BadgeStatus;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  const base = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide";

  if (status === "online") {
    return (
      <span className={cn(base, "bg-black/50 text-[hsl(var(--status-online))]", className)}>
        <span className="size-1.5 rounded-full bg-[hsl(var(--status-online))] animate-pulse-dot" />
        Online
      </span>
    );
  }

  if (status === "new") {
    return (
      <span
        className={cn(
          base,
          "bg-black/50 text-[hsl(var(--status-new))]",
          "border border-[hsl(var(--status-new)/0.5)]",
          className,
        )}
      >
        New
      </span>
    );
  }

  if (status === "trending") {
    return (
      <span
        className={cn(
          base,
          "bg-black/50 text-primary border border-primary/40",
          className,
        )}
      >
        <Flame className="size-2.5" />
        Trending
      </span>
    );
  }

  // popular
  return (
    <span className={cn(base, "bg-black/50 text-white/70 border border-white/20", className)}>
      Popular
    </span>
  );
}
