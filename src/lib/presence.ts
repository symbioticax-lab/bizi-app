// Presence helpers — turn a `last_seen_at` timestamp into a live "online" label.

/** Considered actively online if seen within this window. */
export const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

/** How often the heartbeat pings while the app is open. */
export const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

const HOUR = 60 * 60 * 1000;

// Display buckets, largest first. The label only flips when `diff` crosses one
// of these boundaries — so a card reads "Active 6h ago" steadily from 6h until
// 12h, rather than ticking up every minute.
// Tier drives dot colour in the UI: online → green, recent/1h → amber, 6h/12h → warm-gray, 24h+ → muted gray.
export type PresenceTier = "online" | "recent" | "1h" | "6h" | "12h" | "24h" | "offline";

const BUCKETS: Array<{ min: number; label: string; tier: PresenceTier }> = [
  { min: 24 * HOUR, label: "Active 24h+ ago", tier: "24h" },
  { min: 12 * HOUR, label: "Active 12h ago",  tier: "12h" },
  { min: 6  * HOUR, label: "Active 6h ago",   tier: "6h"  },
  { min: 1  * HOUR, label: "Active 1h ago",   tier: "1h"  },
  { min: 0,         label: "Active recently", tier: "recent" },
];

export type PresenceStatus = {
  online: boolean;
  tier: PresenceTier;
  /** e.g. "Online", "Active 1h ago", "Active 6h ago", "Active 24h+ ago" */
  label: string;
};

export function getPresence(lastSeenAt: string | null | undefined): PresenceStatus {
  if (!lastSeenAt) return { online: false, tier: "offline", label: "Offline" };

  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return { online: false, tier: "offline", label: "Offline" };

  const diff = Date.now() - seen;
  if (diff < ONLINE_THRESHOLD_MS) return { online: true, tier: "online", label: "Online" };

  const bucket = BUCKETS.find((b) => diff >= b.min);
  return { online: false, tier: bucket?.tier ?? "offline", label: bucket?.label ?? "Offline" };
}
