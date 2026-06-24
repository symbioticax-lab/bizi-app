"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to all changes that affect a single negotiation thread:
 *   - new chat messages
 *   - new / updated proposals (counter-offers, status flips)
 *   - the negotiation row itself (status, last_action_by)
 *
 * On any change, calls router.refresh() to revalidate the RSC tree so the
 * proposal panel, action bar, and message thread all stay in sync.
 */
export function NegotiationRealtime({ negotiationId }: { negotiationId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`negotiation:${negotiationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `negotiation_id=eq.${negotiationId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
          filter: `negotiation_id=eq.${negotiationId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "negotiations",
          filter: `id=eq.${negotiationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [negotiationId, router]);

  return null;
}
