"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Simple client-side star/favorite toggle for a profile. */
export function FavoriteButton({ className }: Props) {
  const [favorited, setFavorited] = useState(false);

  return (
    <button
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      onClick={() => setFavorited((prev) => !prev)}
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-all",
        "bg-black/45 backdrop-blur-md hover:bg-black/65",
        favorited
          ? "text-[hsl(var(--status-gold))]"
          : "text-white hover:text-[hsl(var(--status-gold))]",
        className,
      )}
    >
      <Star
        className={cn("size-4 transition-all", favorited && "fill-[hsl(var(--status-gold))]")}
      />
    </button>
  );
}
