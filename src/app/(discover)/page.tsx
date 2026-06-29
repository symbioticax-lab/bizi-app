import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { PersonCard, type Person } from "@/components/people/person-card";
import { OpportunityListItem } from "@/components/opportunity/opportunity-list-item";
import { LocationModule } from "@/components/feed/location-module";
import { FeedGrid } from "@/components/feed/feed-grid";
import type { Opportunity } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover · BIZI" };

type PageSearchParams = {
  tab?: string;
  filter?: string;
  sort?: string;
};

type ListOpportunity = Pick<
  Opportunity,
  "id" | "title" | "category" | "offering_title" | "want_title" | "image_urls" | "created_at" | "owner_id" | "intent" | "location" | "location_lat" | "location_lng"
> & { view_count?: number };

// Column sets — "full" includes columns that depend on pending migrations,
// "base" is the guaranteed-existing subset used as a graceful fallback.
const OPP_BASE_COLS =
  "id, title, category, offering_title, want_title, image_urls, owner_id, created_at, view_count";
const OPP_FULL_COLS =
  `${OPP_BASE_COLS}, intent, location, location_lat, location_lng`;

// PROFILE_BASE_COLS contains only columns present in migration 0001 (the initial
// CREATE TABLE). hero_url and status were added in 0010, location coords in 0021,
// last_seen_at in 0026 — these live in PROFILE_FULL_COLS only so the fallback
// can't fail on a missing column from a migration that hasn't run yet.
const PROFILE_BASE_COLS =
  "id, username, display_name, avatar_url, rating_avg, review_count, skills, location, verified";
const PROFILE_FULL_COLS =
  `${PROFILE_BASE_COLS}, hero_url, status, location_lat, location_lng, last_seen_at`;

// Max profiles rendered on the People tab. Set generously so the full member
// base shows during early growth. When this starts to bite, switch to paginated
// loading ("Load more" / infinite scroll) rather than just raising the number.
const PEOPLE_LIMIT = 200;

type QueryResult<T> = { data: T[] | null; error: { code?: string } | null };

// Runs a query with the full column set; if a column is missing (schema lag),
// transparently retries with the base columns so the feed never breaks.
async function selectWithFallback<T>(
  build: (cols: string) => PromiseLike<QueryResult<T>>,
  fullCols: string,
  baseCols: string,
): Promise<T[]> {
  const res = await build(fullCols);
  if (!res.error) return res.data ?? [];
  if (res.error.code === "42703" || res.error.code === "PGRST204") {
    const fallback = await build(baseCols);
    return fallback.data ?? [];
  }
  return [];
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tab    = searchParams.tab === "people" ? "people" : "opportunities";
  const filter = searchParams.filter ?? (tab === "people" ? "near-you" : "nearby");
  const sort   = searchParams.sort ?? "recommended";

  // Fetch viewer's location + coordinates (for distance), resilient to schema lag.
  let viewerLocation: string | null = null;
  let viewerLat: number | null = null;
  let viewerLng: number | null = null;
  if (user) {
    let res = await supabase
      .from("profiles")
      .select("location, location_lat, location_lng")
      .eq("id", user.id)
      .maybeSingle();
    if (res.error && (res.error.code === "42703" || res.error.code === "PGRST204")) {
      res = await supabase.from("profiles").select("location").eq("id", user.id).maybeSingle();
    }
    const p = res.data as { location?: string | null; location_lat?: number | null; location_lng?: number | null } | null;
    viewerLocation = p?.location ?? null;
    viewerLat = p?.location_lat ?? null;
    viewerLng = p?.location_lng ?? null;
  }

  // ── People tab ──────────────────────────────────────────────────────────────
  if (tab === "people") {
    const today = new Date().toISOString().slice(0, 10);

    const [people, travelRows, connRows, followRows] = await Promise.all([
      selectWithFallback<Person>(
        (cols) => {
          // neq(false) includes both is_active=true AND is_active=null, so profiles
          // created before the column had a DEFAULT are not silently excluded.
          let q = supabase.from("profiles").select(cols).neq("is_active", false).limit(PEOPLE_LIMIT);
          if (filter === "recommended" || sort === "popular") {
            q = q
              .order("rating_avg", { ascending: false, nullsFirst: false })
              .order("review_count", { ascending: false });
          } else if (sort === "popular") {
            q = q.order("review_count", { ascending: false });
          } else {
            q = q.order("created_at", { ascending: false });
          }
          return q as unknown as PromiseLike<QueryResult<Person>>;
        },
        PROFILE_FULL_COLS,
        PROFILE_BASE_COLS,
      ),
      supabase.from("trips").select("user_id").gte("end_date", today),
      user
        ? supabase
            .from("connections")
            .select("requester_id, recipient_id, status")
            .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .neq("status", "declined")
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("follows")
            .select("followee_id")
            .eq("follower_id", user.id)
        : Promise.resolve({ data: null }),
    ]);

    const travelerIds = new Set(
      (travelRows.data ?? []).map((r: { user_id: string }) => r.user_id),
    );

    const connectionMap = new Map<string, "pending_sent" | "pending_received" | "connected">();
    if (user && connRows.data) {
      for (const c of connRows.data as { requester_id: string; recipient_id: string; status: string }[]) {
        if (c.requester_id === user.id) {
          connectionMap.set(c.recipient_id, c.status === "accepted" ? "connected" : "pending_sent");
        } else {
          connectionMap.set(c.requester_id, c.status === "accepted" ? "connected" : "pending_received");
        }
      }
    }

    const followingIds = new Set(
      (followRows.data ?? []).map((r: { followee_id: string }) => r.followee_id),
    );

    return (
      <section className="container space-y-4 py-4 md:space-y-5 md:py-6">
        <Suspense fallback={<div className="h-7" />}>
          <LocationModule location={viewerLocation} />
        </Suspense>
        {people.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {people.map((p) => (
              <PersonCard
                key={p.id}
                person={p}
                bookmarkable={Boolean(user)}
                viewerLat={viewerLat}
                viewerLng={viewerLng}
                hasTravelPlans={travelerIds.has(p.id)}
                viewerId={user?.id ?? null}
                connectionStatus={connectionMap.get(p.id) ?? "none"}
                isFollowing={followingIds.has(p.id)}
              />
            ))}
          </div>
        ) : (
          <PeopleEmpty />
        )}
      </section>
    );
  }

  // ── Opportunities tab ────────────────────────────────────────────────────────

  // "saved" filter — fetch user's bookmarked opportunities
  if (filter === "saved") {
    if (!user) {
      return (
        <section className="container space-y-4 py-4 md:space-y-5 md:py-6">
          <Suspense fallback={<div className="h-7" />}>
            <LocationModule location={viewerLocation} />
          </Suspense>
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-lg font-medium">Sign in to see saved listings</p>
            <Button asChild className="mt-4">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>
      );
    }

    // Fetch saved opportunity IDs from bookmarks
    const { data: bookmarks } = await supabase
      .from("bookmarks")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_type", "listing");

    const savedIds = (bookmarks ?? []).map((b: { item_id: string }) => b.item_id);

    const saved = await selectWithFallback<ListOpportunity>(
      (cols) =>
        supabase
          .from("opportunities")
          .select(cols)
          .eq("status", "active")
          .in("id", savedIds.length > 0 ? savedIds : ["00000000-0000-0000-0000-000000000000"])
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<ListOpportunity>>,
      OPP_FULL_COLS,
      OPP_BASE_COLS,
    );

    return (
      <section className="container space-y-4 py-4 md:space-y-5 md:py-6">
        <Suspense fallback={<div className="h-7" />}>
          <LocationModule location={viewerLocation} />
        </Suspense>
        {saved.length > 0 ? (
          <FeedGrid>
            {saved.map((o) => (
              <OpportunityListItem key={o.id} opportunity={o as never} viewerLat={viewerLat} viewerLng={viewerLng} />
            ))}
          </FeedGrid>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-lg font-medium">No saved listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bookmark listings to find them here later.
            </p>
          </div>
        )}
      </section>
    );
  }

  // Standard opportunity query
  const opportunities = await selectWithFallback<ListOpportunity>(
    (cols) => {
      let q = supabase.from("opportunities").select(cols).eq("status", "active").limit(30);

      // ── Filter: paid / exchange / collabs ──
      if (filter === "paid") {
        q = q.or("want_title.ilike.$%,want_title.ilike.%USD%,want_title.ilike.%budget%");
      } else if (filter === "exchange") {
        q = q.not("want_title", "ilike", "$%");
      } else if (filter === "collabs") {
        q = q.in("category", [
          "Photography", "Design", "Marketing", "Music", "Video & Audio", "Writing",
        ]);
      }

      // ── Sort ──
      switch (sort) {
        case "popular":
          q = q.order("view_count", { ascending: false }).order("created_at", { ascending: false });
          break;
        case "newest":
          q = q.order("created_at", { ascending: false });
          break;
        case "near-you":
          q = q.order("created_at", { ascending: false });
          break;
        case "recommended":
        default:
          q = q.order("view_count", { ascending: false }).order("created_at", { ascending: false });
          break;
      }

      return q as unknown as PromiseLike<QueryResult<ListOpportunity>>;
    },
    OPP_FULL_COLS,
    OPP_BASE_COLS,
  );

  return (
    <section className="container space-y-4 py-4 md:space-y-5 md:py-6">
      <Suspense fallback={<div className="h-7" />}>
        <LocationModule location={viewerLocation} />
      </Suspense>
      {opportunities.length > 0 ? (
        <FeedGrid>
          {opportunities.map((o) => (
            <OpportunityListItem key={o.id} opportunity={o as never} viewerLat={viewerLat} viewerLng={viewerLng} />
          ))}
        </FeedGrid>
      ) : (
        <OpportunitiesEmpty filter={filter} />
      )}
    </section>
  );
}

function PeopleEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-lg font-medium">No creators found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        BIZI is growing — check back as more creatives join.
      </p>
    </div>
  );
}

function OpportunitiesEmpty({ filter }: { filter: string }) {
  const messages: Record<string, string> = {
    paid:     "No paid listings right now. Check back soon.",
    exchange: "No exchange listings right now.",
    collabs:  "No collaboration listings yet.",
    saved:    "You haven't saved any listings.",
  };
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-lg font-medium">No opportunities found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {messages[filter] ?? "Be the first to post a listing."}
      </p>
      <Button asChild className="mt-4">
        <Link href="/opportunities/new">Post a listing</Link>
      </Button>
    </div>
  );
}
