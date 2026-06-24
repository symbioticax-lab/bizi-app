import { notFound, redirect } from "next/navigation";
import { Folder as FolderIcon } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedItemCard } from "@/components/saved/saved-item-card";
import { FolderControls } from "@/components/saved/folder-controls";
import { createClient } from "@/lib/supabase/server";
import { resolveBookmarks } from "@/lib/saved-resolver";

export default async function FolderDetailPage({ params }: { params: { folderId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/saved/${params.folderId}`);

  const { data: folder } = await supabase
    .from("folders")
    .select("*")
    .eq("id", params.folderId)
    .maybeSingle();

  if (!folder || folder.owner_id !== user.id) notFound();

  const { data: rawBookmarks } = await supabase
    .from("bookmarks")
    .select("id, item_type, item_id, folder_id, created_at")
    .eq("user_id", user.id)
    .eq("folder_id", folder.id)
    .order("created_at", { ascending: false });

  const resolved = await resolveBookmarks(rawBookmarks ?? []);

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <BackButton fallbackHref="/saved" label="Back to Saved" />

      <header className="space-y-3">
        <div className="flex items-start gap-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${folder.cover_color}33`, color: folder.cover_color }}
          >
            <FolderIcon className="size-5" />
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{folder.name}</h1>
            {folder.description && (
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{folder.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="muted" className="capitalize">{folder.visibility}</Badge>
              <span className="text-muted-foreground">{resolved.length} {resolved.length === 1 ? "item" : "items"}</span>
            </div>
          </div>
        </div>

        <FolderControls
          folderId={folder.id}
          folderName={folder.name}
          visibility={folder.visibility}
          shareSlug={folder.share_slug}
        />
      </header>

      {resolved.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {resolved.map((b) => (
            <SavedItemCard key={b.bookmarkId} bookmark={b} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-2 p-10 text-center">
            <p className="text-base font-medium">Nothing in this folder yet</p>
            <p className="text-sm text-muted-foreground">
              When you save a profile or listing, pick this folder from the bookmark menu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
