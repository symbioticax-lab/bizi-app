import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { CreateFolderDialog } from "@/components/saved/create-folder-dialog";
import { FolderCard } from "@/components/saved/folder-card";
import { SavedItemCard } from "@/components/saved/saved-item-card";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { resolveBookmarks } from "@/lib/saved-resolver";

export const metadata = { title: "Saved · BIZI" };

type FolderRow = {
  id: string;
  name: string;
  visibility: "private" | "unlisted";
  cover_color: string;
};

type BookmarkRow = {
  id: string;
  item_type: "profile" | "listing";
  item_id: string;
  folder_id: string | null;
  created_at: string;
};

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/saved");

  const [{ data: folders }, { data: rawBookmarks }] = await Promise.all([
    supabase
      .from("folders")
      .select("id, name, visibility, cover_color")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookmarks")
      .select("id, item_type, item_id, folder_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(48),
  ]);

  const folderList = (folders ?? []) as FolderRow[];
  const bookmarkList = (rawBookmarks ?? []) as BookmarkRow[];

  // Per-folder counts (cheap — we already have all bookmarks loaded for the
  // user above; just bucket by folder_id client-side).
  const countsByFolder = new Map<string, number>();
  for (const b of bookmarkList) {
    if (b.folder_id) countsByFolder.set(b.folder_id, (countsByFolder.get(b.folder_id) ?? 0) + 1);
  }

  // "All saves" = bookmarks not in any folder
  const allSaves = bookmarkList.filter((b) => b.folder_id === null);
  const resolvedAllSaves = await resolveBookmarks(allSaves);

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bookmark className="size-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
          <p className="text-sm text-muted-foreground">
            Profiles and listings you've bookmarked. Organize into folders, share with collaborators.
          </p>
        </div>
        <CreateFolderDialog />
      </header>

      {/* Folders grid */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </h2>
          <span className="text-xs text-muted-foreground">{folderList.length} total</span>
        </div>
        {folderList.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {folderList.map((f) => (
              <FolderCard
                key={f.id}
                id={f.id}
                name={f.name}
                itemCount={countsByFolder.get(f.id) ?? 0}
                visibility={f.visibility}
                coverColor={f.cover_color}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No folders yet — tap <span className="text-foreground font-medium">New folder</span> to organize your saves.
            </CardContent>
          </Card>
        )}
      </section>

      {/* All saves (unfoldered bookmarks) */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All saves
          </h2>
          <span className="text-xs text-muted-foreground">{resolvedAllSaves.length} item{resolvedAllSaves.length === 1 ? "" : "s"}</span>
        </div>
        {resolvedAllSaves.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {resolvedAllSaves.map((b) => (
              <SavedItemCard key={b.bookmarkId} bookmark={b} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nothing saved here yet. Bookmark a profile or a listing to start.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
