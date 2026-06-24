"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to changes on a single trade row + reviews for that trade.
 * Refreshes the page when the counterpart marks complete or leaves a review.
 */
export function TradeRealtime({ tradeId }: { tradeId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trade:${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trades",
          filter: `id=eq.${tradeId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
          filter: `trade_id=eq.${tradeId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId, router]);

  return null;
}
