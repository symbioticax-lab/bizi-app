/**
 * Status categorization for the Messages inbox.
 *
 * Every chat thread is attached to a negotiation, so a conversation's
 * category is derived from the negotiation status + (when it exists) the
 * trade's completion timestamp.
 */

export type MessageCategory = "awaiting" | "active" | "completed" | "expired";

/** A completed trade's thread drops to "expired" this many days after it closed. */
export const COMPLETED_TTL_DAYS = 14;

export const CATEGORY_ORDER: MessageCategory[] = ["awaiting", "active", "completed", "expired"];

export const CATEGORY_META: Record<MessageCategory, { label: string; blurb: string }> = {
  awaiting: { label: "Awaiting you", blurb: "Your move — the other side is waiting." },
  active: { label: "Active", blurb: "Trades and negotiations in progress." },
  completed: { label: "Completed", blurb: "Wrapped up in the last 14 days." },
  expired: { label: "Expired", blurb: "Closed over 14 days ago, or cancelled." },
};

// Negotiation states where one party has acted and the other still owes a move.
const AWAITING_STATES = new Set([
  "proposal_sent",
  "counter_sent",
  "completed_by_owner",
  "completed_by_seeker",
]);

export function categorizeConversation(input: {
  status: string;
  lastActionBy: string | null;
  viewerId: string;
  tradeCompletedAt: string | null;
}): MessageCategory {
  const { status, lastActionBy, viewerId, tradeCompletedAt } = input;

  if (status === "cancelled" || status === "expired_inactive") return "expired";

  if (status === "completed") {
    if (tradeCompletedAt) {
      const ageMs = Date.now() - new Date(tradeCompletedAt).getTime();
      if (ageMs > COMPLETED_TTL_DAYS * 24 * 60 * 60 * 1000) return "expired";
    }
    return "completed";
  }

  // Counterpart made the last move in an actionable state → it's the viewer's turn.
  if (AWAITING_STATES.has(status) && lastActionBy !== null && lastActionBy !== viewerId) {
    return "awaiting";
  }

  return "active";
}
