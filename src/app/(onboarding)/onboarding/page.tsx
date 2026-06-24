import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SplashValue } from "./steps/splash-value";
import { StepIdentity } from "./steps/step-identity";
import { StepSkillsOffered } from "./steps/step-skills-offered";
import { StepSkillsWanted } from "./steps/step-skills-wanted";
import { StepProcessing } from "./steps/step-processing";
import { StepResults } from "./steps/step-results";

const MAX_STEP = 5;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed, skills, skills_wanted, trade_location_pref, bio, location",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const raw = Number.parseInt(searchParams.step ?? "0", 10);
  const step = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), MAX_STEP) : 0;

  switch (step) {
    case 0:
      return <SplashValue />;
    case 1:
      return (
        <StepIdentity
          defaultBio={profile?.bio ?? null}
          defaultLocation={profile?.location ?? null}
        />
      );
    case 2:
      return <StepSkillsOffered defaultValue={profile?.skills ?? []} />;
    case 3:
      return <StepSkillsWanted defaultValue={profile?.skills_wanted ?? []} />;
    case 4:
      return <StepProcessing />;
    case 5:
      return <StepResults />;
    default:
      return <SplashValue />;
  }
}
