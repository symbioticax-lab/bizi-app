// Hand-rolled Supabase Database types mirroring supabase/migrations/*.
// Replace with `supabase gen types typescript` output once you've applied the
// migrations and installed the Supabase CLI.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// -----------------------------------------------------------------------------
// Row types — what comes back from `select`. App code imports these directly.
// -----------------------------------------------------------------------------
export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string[];
  rating_avg: number;
  review_count: number;
  verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hero_url: string | null;
  hero_kind: "image" | "gif" | "video" | null;
  hero_focal_x: number;
  hero_focal_y: number;
  hero_poster_url: string | null;
  status: "online" | "available" | "busy" | "away";
  response_time_minutes: number | null;
  accent_color: string;
  theme_preset: "minimal" | "editorial" | "cyber" | "soft_luxury" | "experimental";
  theme_overrides: Record<string, unknown>;
  referral_code: string | null;
  referred_by_id: string | null;
  onboarding_completed: boolean;
  onboarding_goal:
    | "trade_for_services"
    | "find_collaborators"
    | "build_portfolio"
    | "explore"
    | null;
  skills_wanted: string[];
  trade_location_pref: "local" | "remote" | "both" | null;
  trust_pref: "verified_only" | "open" | "escrow" | null;
  last_seen_at: string | null;
};

export type Tap = {
  id: string;
  tapper_id: string;
  owner_id: string;
  target_type: "profile" | "listing";
  target_id: string;
  seen: boolean;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  note: string | null;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

export type ContentView = {
  id: string;
  viewer_id: string;
  owner_id: string;
  target_type: "profile" | "listing";
  target_id: string;
  seen: boolean;
  viewed_at: string;
};

export type Offering = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  image_urls: string[];
  status: "active" | "paused" | "deleted";
  created_at: string;
  updated_at: string;
};

export type Want = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  status: "active" | "paused" | "deleted";
  created_at: string;
};

export type Opportunity = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  offering_title: string;
  offering_desc: string;
  offering_tags: string[];
  want_title: string;
  want_desc: string;
  want_tags: string[];
  category: string;
  image_urls: string[];
  view_count: number;
  intent: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  status: "active" | "paused" | "closed" | "completed" | "deleted" | "draft";
  negotiable: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Interest = {
  id: string;
  opportunity_id: string;
  seeker_id: string;
  message: string;
  offered_title: string;
  offered_desc: string;
  status: "pending" | "seen" | "declined" | "withdrawn" | "converted";
  created_at: string;
  seen_at: string | null;
};

export type NegotiationStatus =
  | "proposal_sent"
  | "counter_sent"
  | "both_accepted"
  | "in_progress"
  | "completed_by_owner"
  | "completed_by_seeker"
  | "completed"
  | "cancelled"
  | "expired_inactive"
  | "disputed";

export type Negotiation = {
  id: string;
  opportunity_id: string;
  interest_id: string;
  owner_id: string;
  seeker_id: string;
  status: NegotiationStatus;
  current_proposal_version: number;
  last_action_by: string | null;
  last_action_at: string;
  expires_at: string | null;
  created_at: string;
};

export type Proposal = {
  id: string;
  negotiation_id: string;
  proposed_by: string;
  version: number;
  owner_gives: string;
  seeker_gives: string;
  timeline_days: number | null;
  notes: string | null;
  status: "pending" | "accepted" | "countered" | "rejected" | "expired";
  created_at: string;
  responded_at: string | null;
};

export type Message = {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  type: "text" | "system" | "proposal_ref";
  proposal_id: string | null;
  created_at: string;
  read_at: string | null;
};

export type Trade = {
  id: string;
  negotiation_id: string;
  final_proposal_id: string;
  owner_id: string;
  seeker_id: string;
  status: "in_progress" | "completed_by_owner" | "completed_by_seeker" | "completed" | "disputed" | "cancelled";
  owner_completed_at: string | null;
  seeker_completed_at: string | null;
  completed_at: string | null;
  dispute_reason: string | null;
  disputed_by: string | null;
  dispute_resolved_at: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  trade_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  reference_id: string | null;
  body: string;
  read: boolean;
  created_at: string;
};

export type Folder = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: "private" | "unlisted";
  share_slug: string | null;
  cover_color: string;
  created_at: string;
  updated_at: string;
};

export type BookmarkItemType = "profile" | "listing";

export type Bookmark = {
  id: string;
  user_id: string;
  item_type: BookmarkItemType;
  item_id: string;
  folder_id: string | null;
  note: string | null;
  created_at: string;
};

// -----------------------------------------------------------------------------
// Database type — shape Supabase requires for typed clients.
// Insert / Update are intentionally permissive (Partial<Row>) so callers don't
// have to spell out every column. The DB still enforces NOT NULL constraints.
// -----------------------------------------------------------------------------
type Tbl<R extends Record<string, unknown>> = {
  Row: R;
  Insert: Partial<R> & Record<string, unknown>;
  Update: Partial<R> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles:      Tbl<Profile>;
      offerings:     Tbl<Offering>;
      wants:         Tbl<Want>;
      opportunities: Tbl<Opportunity>;
      interests:     Tbl<Interest>;
      negotiations:  Tbl<Negotiation>;
      proposals:     Tbl<Proposal>;
      messages:      Tbl<Message>;
      trades:        Tbl<Trade>;
      reviews:       Tbl<Review>;
      notifications: Tbl<Notification>;
    };
    Views: { [_: string]: never };
    Functions: {
      send_first_proposal: {
        Args: {
          p_interest_id: string;
          p_owner_gives: string;
          p_seeker_gives: string;
          p_timeline_days: number | null;
          p_notes: string | null;
        };
        Returns: { negotiation_id: string; proposal_id: string }[];
      };
      submit_counter_proposal: {
        Args: {
          p_negotiation_id: string;
          p_expected_version: number;
          p_owner_gives: string;
          p_seeker_gives: string;
          p_timeline_days: number | null;
          p_notes: string | null;
        };
        Returns: { proposal_id: string; version: number }[];
      };
      accept_proposal: {
        Args: { p_negotiation_id: string; p_proposal_id: string };
        Returns: { trade_id: string }[];
      };
      mark_trade_complete: {
        Args: { p_trade_id: string };
        Returns: { status: string }[];
      };
    };
    Enums: { [_: string]: never };
    CompositeTypes: { [_: string]: never };
  };
};

export type TripSessionRequest = {
  id: string;
  trip_id: string;
  requester_id: string;
  traveler_id: string;
  type: "session" | "connect";
  proposed_date: string | null;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  title: string | null;
  begin_date: string;
  end_date: string;
  available_for_hire: boolean;
  purpose: string;
  opportunity_type: string | null;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};
