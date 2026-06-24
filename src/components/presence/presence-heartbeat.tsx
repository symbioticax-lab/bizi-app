"use client";

import { useEffect } from "react";
import { heartbeatAction } from "@/app/presence/actions";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/presence";

/**
 * Invisible component mounted app-wide. Pings the server on mount and on an
 * interval to keep the current user's `last_seen_at` fresh. Pauses while the
 * tab is hidden and fires immediately when it becomes visible again.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const ping = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void heartbeatAction();
    };

    ping(); // immediate
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
