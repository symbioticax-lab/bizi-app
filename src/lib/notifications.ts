// Maps a notification type + reference_id to its UI representation:
// where the user should land when they tap it, and a fallback verb phrase.

export type NotificationKind =
  | "interest_received"
  | "interest_declined"
  | "interest_withdrawn"
  | "proposal_sent"
  | "counter_sent"
  | "both_accepted"
  | "trade_completed"
  | "review_received"
  | "session_request"
  | "session_accepted"
  | "session_declined"
  | "connection_request"
  | "connection_accepted"
  | "user_followed";

export function notificationCategory(type: string): "travel" | "connection" | "social" | "default" {
  if (type === "session_request" || type === "session_accepted" || type === "session_declined") {
    return "travel";
  }
  if (type === "connection_request" || type === "connection_accepted") {
    return "connection";
  }
  if (type === "user_followed") {
    return "social";
  }
  return "default";
}

export function notificationHref(type: string, referenceId: string | null): string {
  if (!referenceId) return "/notifications";
  switch (type as NotificationKind) {
    case "interest_received":
    case "interest_declined":
    case "interest_withdrawn":
      // reference_id is the opportunity id
      return `/opportunities/${referenceId}`;
    case "proposal_sent":
    case "counter_sent":
      // reference_id is the negotiation id
      return `/negotiations/${referenceId}`;
    case "both_accepted":
    case "trade_completed":
      // reference_id is the trade id
      return `/trades/${referenceId}`;
    case "review_received":
      // reference_id is the trade id
      return `/trades/${referenceId}`;
    case "session_request":
    case "session_accepted":
    case "session_declined":
      return "/travel/travelogue";
    case "connection_request":
    case "connection_accepted":
      return "/notifications";
    case "user_followed":
      // reference_id is the follower's profile id — handled by FollowRow with actor username
      return "/notifications";
    default:
      return "/notifications";
  }
}

export function notificationVerb(type: string): string {
  switch (type as NotificationKind) {
    case "interest_received":   return "expressed interest in";
    case "interest_declined":   return "declined your interest in";
    case "interest_withdrawn":  return "withdrew their interest in";
    case "proposal_sent":       return "sent you a proposal for";
    case "counter_sent":        return "sent a counter-offer on";
    case "both_accepted":       return "accepted the deal — trade started for";
    case "trade_completed":     return "completed the trade for";
    case "review_received":     return "left you a review";
    case "session_request":      return "wants to meet during your trip to";
    case "session_accepted":     return "accepted your session request for";
    case "session_declined":     return "declined your session request for";
    case "connection_request":   return "wants to connect with you";
    case "connection_accepted":  return "accepted your connection request";
    case "user_followed":        return "started following you";
    default:                     return "did something with";
  }
}
