"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: true; bookmarkId?: string; folderId?: string } | undefined;

const ItemType = z.enum(["profile", "listing"]);

// -----------------------------------------------------------------------------
// Bookmark toggle — adds or removes a bookmark for the (item_type, item_id) pair.
// Optionally targets a specific folder; otherwise lands in "All saves" (folder_id NULL).
// -----------------------------------------------------------------------------
export async function toggleBookmarkAction(input: {
  itemType: "profile" | "listing";
  itemId: string;
  folderId?: string | null;
}): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save items." };

  const itemType = ItemType.parse(input.itemType);
  const itemId = z.string().uuid().parse(input.itemId);
  const folderId = input.folderId ? z.string().uuid().parse(input.folderId) : null;

  // Self-bookmark prevention for profiles
  if (itemType === "profile" && itemId === user.id) {
    return { error: "You can't save your own profile." };
  }

  // If a folder is provided, verify ownership.
  if (folderId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("id, owner_id")
      .eq("id", folderId)
      .maybeSingle();
    if (!folder || folder.owner_id !== user.id) return { error: "Folder not found." };
  }

  // Look up an existing bookmark for this (user, item).
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id, folder_id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    // If the request targets a different folder, MOVE rather than toggle off.
    if (folderId !== undefined && existing.folder_id !== folderId) {
      const { error } = await supabase
        .from("bookmarks")
        .update({ folder_id: folderId })
        .eq("id", existing.id);
      if (error) return { error: error.message };
      revalidatePath("/saved");
      revalidatePath("/saved/[folderId]", "page");
      return { ok: true, bookmarkId: existing.id };
    }
    // Otherwise toggle off (delete).
    const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/saved");
    revalidatePath("/saved/[folderId]", "page");
    return { ok: true };
  }

  // Insert new bookmark.
  const { data: inserted, error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, item_type: itemType, item_id: itemId, folder_id: folderId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/saved");
  revalidatePath("/saved/[folderId]", "page");
  return { ok: true, bookmarkId: inserted.id };
}

// -----------------------------------------------------------------------------
// Folder creation
// -----------------------------------------------------------------------------
const NameSchema = z.string().trim().min(1, "Name your folder").max(60);

export async function createFolderAction(input: {
  name: string;
  description?: string | null;
  coverColor?: string;
}): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const nameParsed = NameSchema.safeParse(input.name);
  if (!nameParsed.success) return { error: nameParsed.error.issues[0]?.message ?? "Invalid name" };

  const description = input.description?.trim() || null;
  const coverColor = input.coverColor && /^#[0-9A-Fa-f]{6}$/.test(input.coverColor)
    ? input.coverColor
    : "#D4FF3D";

  const { data, error } = await supabase
    .from("folders")
    .insert({ owner_id: user.id, name: nameParsed.data, description, cover_color: coverColor })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/saved");
  return { ok: true, folderId: data.id };
}

// -----------------------------------------------------------------------------
// Folder rename / description / cover update
// -----------------------------------------------------------------------------
export async function updateFolderAction(input: {
  id: string;
  name?: string;
  description?: string | null;
  coverColor?: string;
}): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const id = z.string().uuid().parse(input.id);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const p = NameSchema.safeParse(input.name);
    if (!p.success) return { error: p.error.issues[0]?.message ?? "Invalid name" };
    patch.name = p.data;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.coverColor && /^#[0-9A-Fa-f]{6}$/.test(input.coverColor)) {
    patch.cover_color = input.coverColor;
  }
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase
    .from("folders")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/saved");
  revalidatePath(`/saved/${id}`);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Toggle folder visibility (private ↔ unlisted). Generates a share_slug on the
// first transition to unlisted; the slug is stable forever after.
// -----------------------------------------------------------------------------
export async function setFolderVisibilityAction(input: {
  id: string;
  visibility: "private" | "unlisted";
}): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const id = z.string().uuid().parse(input.id);

  // Need existing share_slug if any
  const { data: folder } = await supabase
    .from("folders")
    .select("id, owner_id, share_slug")
    .eq("id", id)
    .maybeSingle();
  if (!folder || folder.owner_id !== user.id) return { error: "Folder not found." };

  const patch: Record<string, unknown> = { visibility: input.visibility };
  if (input.visibility === "unlisted" && !folder.share_slug) {
    // Generate a 12-char base32-ish slug. Loop on the rare collision.
    let slug = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      slug = randomSlug(12);
      const { count } = await supabase
        .from("folders")
        .select("id", { count: "exact", head: true })
        .eq("share_slug", slug);
      if ((count ?? 0) === 0) break;
    }
    patch.share_slug = slug;
  }

  const { error } = await supabase
    .from("folders")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/saved");
  revalidatePath(`/saved/${id}`);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Delete folder. Bookmarks inside the folder fall back to "All saves" (folder_id
// is set to NULL via the FK ON DELETE SET NULL).
// -----------------------------------------------------------------------------
export async function deleteFolderAction(input: { id: string }): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const id = z.string().uuid().parse(input.id);

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/saved");
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Move a bookmark to a folder (or to All saves if folderId is null).
// -----------------------------------------------------------------------------
export async function setBookmarkFolderAction(input: {
  bookmarkId: string;
  folderId: string | null;
}): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const bookmarkId = z.string().uuid().parse(input.bookmarkId);
  const folderId = input.folderId ? z.string().uuid().parse(input.folderId) : null;

  if (folderId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("owner_id")
      .eq("id", folderId)
      .maybeSingle();
    if (!folder || folder.owner_id !== user.id) return { error: "Folder not found." };
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ folder_id: folderId })
    .eq("id", bookmarkId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/saved");
  revalidatePath("/saved/[folderId]", "page");
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Remove a bookmark explicitly (used by the trash icon in the saved view).
// -----------------------------------------------------------------------------
export async function removeBookmarkAction(input: { bookmarkId: string }): Promise<ActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookmarkId = z.string().uuid().parse(input.bookmarkId);
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/saved");
  revalidatePath("/saved/[folderId]", "page");
  return { ok: true };
}

// Crockford-ish base32 slug. Avoids ambiguous chars (0/O, 1/I/L).
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function randomSlug(length: number): string {
  let out = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out += SLUG_ALPHABET[arr[i] % SLUG_ALPHABET.length];
  }
  return out;
}
