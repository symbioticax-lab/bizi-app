// Server-only helper that resolves a list of bookmark rows into the actual
// data needed to render them (a profile or an opportunity). Bookmarks are
// polymorphic — item_type is 'profile' or 'listing' — and rendering them in
// a single grid requires fetching both kinds and stitching together.

import { createClient } from "@/lib/supabase/server";

export type ResolvedProfile = {
  kind: "profile";
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  hero_url: string | null;
  rating_avg: number;
  review_count: number;
  skills: string[];
  location: string | null;
};

export type ResolvedListing = {
  kind: "listing";
  id: string;
  title: string;
  category: string;
  offering_title: string;
  want_title: string;
  image_urls: string[];
  created_at: string;
  status: string;
};

export type ResolvedBookmark =
  | { bookmarkId: string; folderId: string | null; createdAt: string; resolved: ResolvedProfile }
  | { bookmarkId: string; folderId: string | null; createdAt: string; resolved: ResolvedListing }
  | { bookmarkId: string; folderId: string | null; createdAt: string; resolved: null }; // item was deleted

type BookmarkRow = {
  id: string;
  item_type: "profile" | "listing";
  item_id: string;
  folder_id: string | null;
  created_at: string;
};

export async function resolveBookmarks(rows: BookmarkRow[]): Promise<ResolvedBookmark[]> {
  if (rows.length === 0) return [];
  const supabase = createClient();

  const profileIds = rows.filter((r) => r.item_type === "profile").map((r) => r.item_id);
  const listingIds = rows.filter((r) => r.item_type === "listing").map((r) => r.item_id);

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, hero_url, rating_avg, review_count, skills, location")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    listingIds.length > 0
      ? supabase
          .from("opportunities")
          .select("id, title, category, offering_title, want_title, image_urls, created_at, status")
          .in("id", listingIds)
          .neq("status", "deleted")
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const listingById = new Map((listings ?? []).map((l) => [l.id as string, l]));

  return rows.map((r) => {
    const base = { bookmarkId: r.id, folderId: r.folder_id, createdAt: r.created_at };
    if (r.item_type === "profile") {
      const p = profileById.get(r.item_id);
      if (!p) return { ...base, resolved: null };
      return { ...base, resolved: { kind: "profile", ...p } as ResolvedProfile };
    }
    const l = listingById.get(r.item_id);
    if (!l) return { ...base, resolved: null };
    return { ...base, resolved: { kind: "listing", ...l } as ResolvedListing };
  });
}
