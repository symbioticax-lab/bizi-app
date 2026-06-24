"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Records that the current user is active right now. Called periodically by the
 * client PresenceHeartbeat while the app is open. No-op for signed-out users.
 * Relies on the `profiles_update_self` RLS policy.
 */
export async function heartbeatAction(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);
}
