import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tapCutoffIso } from "@/lib/taps";

export type AlertCounts = {
  notifications: number;
  taps: number;
  views: number;
  /** Unread chat messages — negotiation threads + direct messages combined. */
  messages: number;
  /**
   * Bell badge total. Notifications + taps + views only. Messages are tracked
   * separately so they light the Messages icon, not the notifications bell.
   */
  total: number;
};

/**
 * Unseen counts across the Alerts surfaces + chat. Used by the header badges
 * (bell `total`, Messages icon `messages`) and the AlertsTabs sub-nav (per-tab).
 *
 * `content_views` is service-role only, so its count goes through the admin
 * client. Message counts rely on RLS to scope to the user's own threads:
 * `messages_read` restricts to negotiations the user is in, and
 * `dm_messages_select` to DM threads the user is a participant of. If any
 * table doesn't exist yet (migration not applied), the query returns an error
 * rather than throwing — that count falls back to 0.
 */
export async function getAlertCounts(userId: string): Promise<AlertCounts> {
  const supabase = createClient();
  const admin = createAdminClient();

  const [notifRes, tapsRes, viewsRes, negMsgRes, dmMsgRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false),
    supabase
      .from("taps")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("seen", false)
      .gte("created_at", tapCutoffIso()),
    admin
      .from("content_views")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("seen", false),
    // Unread negotiation messages — RLS scopes to the user's negotiations.
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", userId)
      .is("read_at", null),
    // Unread direct messages — RLS scopes to the user's DM threads.
    supabase
      .from("dm_messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", userId)
      .is("read_at", null),
  ]);

  const notifications = notifRes.count ?? 0;
  const taps = tapsRes.count ?? 0;
  const views = viewsRes.count ?? 0;
  const messages = (negMsgRes.count ?? 0) + (dmMsgRes.count ?? 0);

  return { notifications, taps, views, messages, total: notifications + taps + views };
}
