// Server-only helper that resolves the completion state of every onboarding
// quest for a given user, using existing data (no quest table). Cheap —
// runs counts and HEAD queries against indexes.

import { createClient } from "@/lib/supabase/server";
import { QUESTS, TOTAL_QUESTS, levelForCount, nextLevelForCount } from "./quests";

export type QuestStatus = {
  id: string;
  done: boolean;
};

export type JourneyState = {
  total: number;
  completedCount: number;
  pctComplete: number;
  level: ReturnType<typeof levelForCount>;
  nextLevel: ReturnType<typeof nextLevelForCount>;
  /** Quests in the original definition order, each marked done/not-done. */
  quests: QuestStatus[];
  /** Convenience: the next 3 incomplete quests (for the "next steps" panel). */
  nextUp: QuestStatus[];
};

type Profile = {
  id: string;
  avatar_url: string | null;
  hero_url: string | null;
  bio: string | null;
  skills: string[] | null;
};

export async function loadJourneyState(profile: Profile): Promise<JourneyState> {
  const supabase = createClient();

  const [
    { count: offeringsCount },
    { count: wantsCount },
    { count: listingsCount },
    { count: interestsSent },
    { count: interestsReceived },
    { count: completedTrades },
    { count: reviewsReceived },
  ] = await Promise.all([
    supabase.from("offerings").select("id", { count: "exact", head: true })
      .eq("user_id", profile.id).eq("status", "active"),
    supabase.from("wants").select("id", { count: "exact", head: true })
      .eq("user_id", profile.id).eq("status", "active"),
    supabase.from("opportunities").select("id", { count: "exact", head: true })
      .eq("owner_id", profile.id).neq("status", "deleted"),
    supabase.from("interests").select("id", { count: "exact", head: true })
      .eq("seeker_id", profile.id),
    supabase.from("interests").select("id, opportunity:opportunities!inner(owner_id)", { count: "exact", head: true })
      .eq("opportunities.owner_id", profile.id),
    supabase.from("trades").select("id", { count: "exact", head: true })
      .or(`owner_id.eq.${profile.id},seeker_id.eq.${profile.id}`)
      .eq("status", "completed"),
    supabase.from("reviews").select("id", { count: "exact", head: true })
      .eq("reviewee_id", profile.id),
  ]);

  const checks: Record<string, boolean> = {
    avatar:     Boolean(profile.avatar_url),
    hero:       Boolean(profile.hero_url),
    bio:        (profile.bio?.trim().length ?? 0) >= 20,
    skill:      (profile.skills?.length ?? 0) >= 1,
    offering:   (offeringsCount ?? 0) >= 1,
    want:       (wantsCount ?? 0) >= 1,
    listing:    (listingsCount ?? 0) >= 1,
    connection: (interestsSent ?? 0) >= 1 || (interestsReceived ?? 0) >= 1,
    trade:      (completedTrades ?? 0) >= 1,
    review:     (reviewsReceived ?? 0) >= 1,
  };

  const quests: QuestStatus[] = QUESTS.map((q) => ({ id: q.id, done: checks[q.id] === true }));
  const completedCount = quests.filter((q) => q.done).length;
  const pctComplete = Math.round((completedCount / TOTAL_QUESTS) * 100);
  const level = levelForCount(completedCount);
  const nextLevel = nextLevelForCount(completedCount);
  const nextUp = quests.filter((q) => !q.done).slice(0, 3);

  return {
    total: TOTAL_QUESTS,
    completedCount,
    pctComplete,
    level,
    nextLevel,
    quests,
    nextUp,
  };
}
