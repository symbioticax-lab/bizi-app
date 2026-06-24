import { createClient } from "@/lib/supabase/server";
import { getAlertCounts } from "@/lib/alerts";
import { AlertsTabs } from "./alerts-tabs";

/**
 * Server wrapper for AlertsTabs — resolves the per-tab unseen counts so the
 * three Alerts pages can each just drop in <AlertsTabsServer />.
 */
export async function AlertsTabsServer() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const counts = user
    ? await getAlertCounts(user.id)
    : { notifications: 0, taps: 0, views: 0, messages: 0, total: 0 };

  return <AlertsTabs counts={counts} />;
}
