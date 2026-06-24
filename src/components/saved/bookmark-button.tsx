"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Plus, Folder as FolderIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toggleBookmarkAction, createFolderAction } from "@/app/saved/actions";

type Folder = { id: string; name: string; cover_color: string };

type Props = {
  itemType: "profile" | "listing";
  itemId: string;
  /** Subtle/icon variant or full-pill style. */
  variant?: "icon" | "pill";
  /** Provide a label override for the pill variant when not bookmarked. */
  label?: string;
  className?: string;
};

/**
 * Bookmark toggle. Click → popover opens with the user's folders.
 *   • Already saved: shows the current folder (or "All saves") and a Remove button
 *   • Not saved: lists folders to "Save to" + a Save without folder option +
 *     an inline "Create folder" form
 *
 * Initial saved-state is fetched from Supabase on mount (no prop drilling
 * required — the button is drop-in anywhere).
 */
export function BookmarkButton({ itemType, itemId, variant = "icon", label = "Save", className }: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState<boolean | null>(null); // null = unknown / loading
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [creatingName, setCreatingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const newInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve initial state
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setBookmarked(false);
        return;
      }
      const { data: bm } = await supabase
        .from("bookmarks")
        .select("id, folder_id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      if (!cancelled) {
        setBookmarked(Boolean(bm));
        setCurrentFolderId((bm?.folder_id as string | null) ?? null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [itemType, itemId, supabase]);

  // Lazy-load folders the first time the popover opens
  useEffect(() => {
    if (!open || folders.length > 0) return;
    let cancelled = false;
    async function loadFolders() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("folders")
        .select("id, name, cover_color")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) setFolders((data as Folder[]) ?? []);
    }
    loadFolders();
    return () => { cancelled = true; };
  }, [open, folders.length, supabase]);

  function commit(folderId: string | null) {
    setError(null);
    // Optimistic toggle
    const wasBookmarked = bookmarked;
    const wasFolder = currentFolderId;
    setBookmarked(true);
    setCurrentFolderId(folderId);
    setOpen(false);

    startTransition(async () => {
      const result = await toggleBookmarkAction({ itemType, itemId, folderId });
      if (result?.error) {
        setBookmarked(wasBookmarked);
        setCurrentFolderId(wasFolder);
        setError(result.error);
        setOpen(true);
      }
    });
  }

  function unsave() {
    if (!bookmarked) return;
    setError(null);
    setBookmarked(false);
    setCurrentFolderId(null);
    setOpen(false);
    startTransition(async () => {
      // Toggle off — second call to toggleBookmarkAction with no folderId
      // change deletes the row.
      const result = await toggleBookmarkAction({ itemType, itemId });
      if (result?.error) {
        setBookmarked(true);
        setError(result.error);
        setOpen(true);
      }
    });
  }

  function createAndSave(name: string) {
    setError(null);
    startTransition(async () => {
      const result = await createFolderAction({ name });
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.folderId) {
        // Refresh folder list and save into the new folder
        setFolders((prev) => [{ id: result.folderId!, name: name.trim(), cover_color: "#D4FF3D" }, ...prev]);
        setCreatingName("");
        await commitInline(result.folderId);
      }
    });
  }

  // Internal helper for createAndSave — bypasses startTransition (already inside one)
  async function commitInline(folderId: string | null) {
    const result = await toggleBookmarkAction({ itemType, itemId, folderId });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setBookmarked(true);
    setCurrentFolderId(folderId);
    setOpen(false);
  }

  const isSaved = bookmarked === true;
  const Icon = isSaved ? BookmarkCheck : Bookmark;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "pill" ? (
          <Button
            type="button"
            variant={isSaved ? "default" : "outline"}
            size="sm"
            className={cn("gap-1.5", className)}
            disabled={bookmarked === null}
          >
            <Icon className="size-4" />
            {isSaved ? "Saved" : label}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-colors",
              isSaved && "text-primary",
              className,
            )}
            aria-label={isSaved ? "Saved — change folder or remove" : "Save"}
            disabled={bookmarked === null}
          >
            <Icon className="size-5" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          requestAnimationFrame(() => newInputRef.current?.focus());
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isSaved ? "Saved" : "Save to…"}
            </p>
            {pending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          </div>

          {/* Folder list */}
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            <FolderRow
              label="All saves"
              colorDot="#FFFFFF55"
              active={isSaved && currentFolderId === null}
              onSelect={() => commit(null)}
            />
            {folders.map((f) => (
              <FolderRow
                key={f.id}
                label={f.name}
                colorDot={f.cover_color}
                active={isSaved && currentFolderId === f.id}
                onSelect={() => commit(f.id)}
              />
            ))}
          </ul>

          {/* Create new folder inline */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (creatingName.trim().length === 0) return;
              createAndSave(creatingName);
            }}
            className="flex gap-1.5"
          >
            <input
              ref={newInputRef}
              type="text"
              value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 rounded-md border border-input bg-input/40 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              maxLength={60}
            />
            <button
              type="submit"
              aria-label="Create folder and save"
              className="inline-flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
              disabled={creatingName.trim().length === 0 || pending}
            >
              <Plus className="size-4" />
            </button>
          </form>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {isSaved && (
            <button
              type="button"
              onClick={unsave}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              <X className="size-3.5" /> Remove from saved
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FolderRow({
  label, colorDot, active, onSelect,
}: {
  label: string;
  colorDot: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          active ? "bg-primary/15 text-primary" : "hover:bg-muted",
        )}
      >
        <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{label}</span>
        <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: colorDot }} />
        {active && <BookmarkCheck className="size-3.5 text-primary" />}
      </button>
    </li>
  );
}
