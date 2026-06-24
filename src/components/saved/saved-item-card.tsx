import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ResolvedBookmark } from "@/lib/saved-resolver";
import { initials, formatRelative } from "@/lib/utils";

type Props = {
  bookmark: ResolvedBookmark;
};

/**
 * Single tile for a saved item — handles both profile and listing kinds.
 * Layout matches the Discover card shape so the grid feels cohesive.
 */
export function SavedItemCard({ bookmark }: Props) {
  if (!bookmark.resolved) return <DeletedTile bookmarkCreatedAt={bookmark.createdAt} />;
  const item = bookmark.resolved;

  if (item.kind === "profile") {
    const cover = item.hero_url;
    return (
      <Link
        href={`/profile/${item.username}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-card/40 transition-colors hover:border-primary/40"
      >
        <div className="relative aspect-[4/5] bg-muted">
          {cover ? (
            <Image src={cover} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              <User className="size-8" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-black/40">
                {item.avatar_url && <AvatarImage src={item.avatar_url} alt="" />}
                <AvatarFallback className="text-[10px]">{initials(item.display_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.display_name}</p>
                <p className="truncate text-[11px] text-white/70">@{item.username}</p>
              </div>
            </div>
          </div>
          <Badge variant="muted" className="absolute left-2 top-2 text-[10px]">Profile</Badge>
        </div>
        <div className="space-y-1.5 p-3">
          {item.location && <p className="text-xs text-muted-foreground">{item.location}</p>}
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="font-medium">
              {item.review_count > 0 ? Number(item.rating_avg).toFixed(1) : "—"}
            </span>
            <span className="text-muted-foreground">({item.review_count})</span>
          </div>
          {item.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {item.skills.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
              ))}
              {item.skills.length > 3 && (
                <Badge variant="muted" className="text-[10px]">+{item.skills.length - 3}</Badge>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Listing
  const cover = item.image_urls?.[0];
  return (
    <Link
      href={`/opportunities/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-card/40 transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-[4/5] bg-muted">
        {cover ? (
          <Image src={cover} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <ArrowLeftRight className="size-8" />
          </div>
        )}
        <Badge variant="secondary" className="absolute left-2 top-2 text-[10px]">{item.category}</Badge>
        <Badge variant="muted" className="absolute right-2 top-2 text-[10px]">Listing</Badge>
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold">{item.title}</h3>
        <Badge variant="muted" className="block w-full truncate text-[10px]">
          Offers · {item.offering_title}
        </Badge>
        <Badge variant="outline" className="block w-full truncate text-[10px]">
          Wants · {item.want_title}
        </Badge>
        <p className="text-[10px] text-muted-foreground">{formatRelative(item.created_at)}</p>
      </div>
    </Link>
  );
}

function DeletedTile({ bookmarkCreatedAt }: { bookmarkCreatedAt: string }) {
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
      <ArrowLeftRight className="size-5 opacity-50" />
      <p className="mt-2">No longer available</p>
      <p className="mt-0.5">Saved {formatRelative(bookmarkCreatedAt)}</p>
    </div>
  );
}
