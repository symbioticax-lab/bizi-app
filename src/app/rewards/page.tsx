import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { JourneyCard } from "@/components/profile/journey/journey-card";
import { ReferralCard } from "@/components/profile/referral/referral-card";
import { TierCelebration } from "@/components/profile/celebration/tier-celebration";
import { loadJourneyState } from "@/lib/quest-state";
import { loadReferralState } from "@/lib/referral-state";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rewards · BIZI" };

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rewards");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, hero_url, bio, skills, referral_code")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard");

  const [journey, referral] = await Promise.all([
    loadJourneyState({
      id: profile.id,
      avatar_url: profile.avatar_url,
      hero_url: profile.hero_url,
      bio: profile.bio,
      skills: profile.skills,
    }),
    loadReferralState(profile.id, profile.referral_code ?? null),
  ]);

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <TierCelebration
        journey={{ num: journey.level.num, name: journey.level.name }}
        referral={{ num: referral.currentTier.num, name: referral.currentTier.name }}
      />

      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Trophy className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rewards</h1>
          <p className="text-sm text-muted-foreground">
            Your onboarding journey + referral progress. Levels unlock perks as you grow.
          </p>
        </div>
      </header>

      <JourneyCard state={journey} username={profile.username} />
      <ReferralCard state={referral} displayName={profile.display_name} />
    </div>
  );
}
