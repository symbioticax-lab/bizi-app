import Link from "next/link";
import { notFound } from "next/navigation";
import { Folder as FolderIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SavedItemCard } from "@/components/saved/saved-item-card";
import { createClient } from "@/lib/supabase/server";
import { resolveBookmarks } from "@/lib/saved-resolver";
import { initials } from "@/lib/utils";

type Props = { params: { shareSlug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("folders")
    .select("name, description, visibility")
    .eq("share_slug", params.shareSlug)
    .maybeSingle();
  if (!data || data.visibility !== "unlisted") return { title: "Folder · BIZI" };
  return {
    title: `${data.name} · BIZI`,
    description: data.description || `A shared collection on BIZI`,
  };
}

export default async function PublicFolderPage({ params }: Props) {
  const supabase = createClient();

  const { data: folder } = await supabase
    .from("folders")
    .select("id, name, description, cover_color, owner_id, visibility, share_slug")
    .eq("share_slug", params.shareSlug)
    .maybeSingle();

  if (!folder || folder.visibility !== "unlisted") notFound();

  const [{ data: owner }, { data: rawBookmarks }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", folder.owner_id)
      .maybeSingle(),
    supabase
      .from("bookmarks")
      .select("id, item_type, item_id, folder_id, created_at")
      .eq("folder_id", folder.id)
      .order("created_at", { ascending: false }),
  ]);

  const resolved = await resolveBookmarks(rawBookmarks ?? []);

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <header className="space-y-4">
        <div className="flex items-start gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${folder.cover_color}33`, color: folder.cover_color }}
          >
            <FolderIcon className="size-6" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shared collection
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight md:text-3xl">{folder.name}</h1>
            {folder.description && (
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{folder.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {resolved.length} {resolved.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {owner && (
          <Link
            href={`/profile/${owner.username}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm transition-colors hover:bg-card"
          >
            <Avatar className="h-6 w-6">
              {owner.avatar_url && <AvatarImage src={owner.avatar_url} alt="" />}
              <AvatarFallback className="text-[10px]">{initials(owner.display_name)}</AvatarFallback>
            </Avatar>
            <span>Curated by</span>
            <span className="font-medium">{owner.display_name}</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>
        )}
      </header>

      {resolved.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {resolved.map((b) => (
            <SavedItemCard key={b.bookmarkId} bookmark={b} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            This collection is empty so far.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
