"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Global realtime listener for everything that drives the header/nav badges and
 * the inbox/notification lists:
 *   - notifications  → bell dot + notifications page
 *   - messages       → Messages-icon dot + inbox (negotiation chats)
 *   - dm_messages    → Messages-icon dot + inbox (direct messages)
 *
 * On any change it calls router.refresh() to revalidate the RSC tree, so unread
 * counts, online dots, and last-message previews update live — no manual reload.
 *
 * The message tables are subscribed without a row filter; Realtime enforces the
 * tables' RLS SELECT policies, so each client only receives changes for threads
 * it participates in. Mounted once globally (in SiteHeader) for signed-in users.
 */
export function AlertsRealtime({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => router.refresh();

    const channel = supabase
      .channel(`alerts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dm_messages" },
        refresh,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
