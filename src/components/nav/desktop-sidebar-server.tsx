import { createClient } from "@/lib/supabase/server";
import { getAlertCounts } from "@/lib/alerts";
import { DesktopSidebar } from "./desktop-sidebar";

export async function DesktopSidebarServer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, counts] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url, subscription_tier")
      .eq("id", user.id)
      .maybeSingle(),
    getAlertCounts(user.id),
  ]);

  return (
    <DesktopSidebar
      username={profile?.username ?? null}
      displayName={profile?.display_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      isPro={profile?.subscription_tier === "pro"}
      unreadCount={counts.total}
      messageCount={counts.messages}
    />
  );
}
