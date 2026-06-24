import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { MatchCardsClient, type MatchListing } from "./match-cards-client";
import { ResultsFooter } from "./results-footer";

type MatchProfile = Pick<
  Profile,
  "id" | "display_name" | "username" | "avatar_url" | "location" | "bio" | "skills" | "rating_avg"
>;

export async function StepResults() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: viewer } = await supabase
    .from("profiles")
    .select("skills_wanted")
    .eq("id", user.id)
    .maybeSingle();

  const wanted = viewer?.skills_wanted ?? [];

  let profiles: MatchProfile[] = [];

  if (wanted.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, location, bio, skills, rating_avg")
      .neq("id", user.id)
      .eq("is_active", true)
      .overlaps("skills", wanted)
      .order("rating_avg", { ascending: false })
      .limit(3);
    profiles = data ?? [];
  }

  if (profiles.length < 3) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, location, bio, skills, rating_avg")
      .neq("id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(3 - profiles.length);
    const existing = new Set(profiles.map((m) => m.id));
    for (const row of data ?? []) {
      if (!existing.has(row.id)) profiles.push(row);
    }
  }

  // Fetch active listings for all matched profiles in one query
  const ownerIds = profiles.map((p) => p.id);
  const listingsMap: Record<string, MatchListing[]> = {};

  if (ownerIds.length > 0) {
    const { data: listingsData } = await supabase
      .from("opportunities")
      .select("id, title, category, offering_title, want_title, image_urls, intent, owner_id")
      .in("owner_id", ownerIds)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    for (const l of listingsData ?? []) {
      if (!listingsMap[l.owner_id]) listingsMap[l.owner_id] = [];
      if (listingsMap[l.owner_id].length < 3) {
        listingsMap[l.owner_id].push(l as MatchListing);
      }
    }
  }

  const matches = profiles.map((p) => ({
    ...p,
    listings: listingsMap[p.id] ?? [],
  }));

  return (
    <div className="flex w-full flex-1 flex-col py-2">
      <div className="space-y-2 pb-5 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Your matches
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
          {wanted.length > 0 && matches.length > 0
            ? `${matches.length} ${matches.length === 1 ? "person is" : "people are"} ready to trade.`
            : "Here's who's on BIZI."}
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          {matches.length > 0
            ? "Tap any profile to see their full work."
            : "Add what you're looking for to sharpen your matches."}
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <MatchCardsClient matches={matches} highlight={wanted} />
      </div>

      <ResultsFooter />
    </div>
  );
}
