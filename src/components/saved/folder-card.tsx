import Link from "next/link";
import { Folder as FolderIcon, Globe2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  itemCount: number;
  visibility: "private" | "unlisted";
  coverColor: string;
  href?: string;
  /** Show the visibility icon (lock/globe). Off for the visitor-share view. */
  showVisibility?: boolean;
};

export function FolderCard({
  id, name, itemCount, visibility, coverColor, href, showVisibility = true,
}: Props) {
  const target = href ?? `/saved/${id}`;
  return (
    <Link
      href={target}
      className={cn(
        "group relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl",
        "border border-white/[0.08] bg-card/40 transition-colors hover:border-primary/40",
      )}
    >
      {/* Painted cover with the folder's accent color */}
      <div
        className="relative flex flex-1 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${coverColor}40 0%, ${coverColor}15 60%, transparent 100%)`,
        }}
      >
        <FolderIcon className="size-10 text-white/40" />
        {showVisibility && (
          <span
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur"
            aria-label={visibility === "unlisted" ? "Unlisted (anyone with link)" : "Private"}
          >
            {visibility === "unlisted" ? <Globe2 className="size-2.5" /> : <Lock className="size-2.5" />}
            {visibility === "unlisted" ? "Unlisted" : "Private"}
          </span>
        )}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{name}</p>
        <p className="text-[11px] text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>
    </Link>
  );
}
