import { createClient } from "@/lib/supabase/server";
import { getAlertCounts } from "@/lib/alerts";
import { BottomNavInner } from "./bottom-nav-inner";

/**
 * Server wrapper that resolves the auth state + minimal profile data needed
 * by the bottom navigation. Renders nothing for signed-out visitors — the
 * landing/discover page is fully usable without nav for them.
 */
export async function BottomNav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, counts] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, subscription_tier").eq("id", user.id).maybeSingle(),
    getAlertCounts(user.id),
  ]);

  return (
    <BottomNavInner
      username={profile?.username ?? null}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      unreadCount={counts.total}
      isPro={profile?.subscription_tier === 'pro'}
    />
  );
}
