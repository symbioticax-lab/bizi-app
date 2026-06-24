import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription/server";
import { TIER_LIMITS, TIER_NAMES, isAtListingLimit } from "@/lib/subscription/tiers";
import { ListingLimitWall } from "@/components/subscription/listing-limit-wall";
import { SinglePageForm } from "./single-page-form";

export const metadata = { title: "Create Listing · BIZI" };

export default async function NewOpportunityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/opportunities/new");

  const tier = await getUserTier();
  const limit = TIER_LIMITS[tier]?.listings ?? TIER_LIMITS.free.listings;

  if (limit !== Infinity) {
    const { count } = await supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .in("status", ["active", "draft"]);

    if (isAtListingLimit(tier, count ?? 0)) {
      return (
        <ListingLimitWall
          currentTierName={TIER_NAMES[tier] ?? TIER_NAMES.free}
          currentLimit={limit}
          nextTierLimitLabel="up to 10"
        />
      );
    }
  }

  return <SinglePageForm userId={user.id} cancelHref="/" />;
}
