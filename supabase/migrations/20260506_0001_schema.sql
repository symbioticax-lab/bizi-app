-- =============================================================================
-- BIZI MVP — Schema (apply first)
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/dkmqkzmkfbmwmywynrbb/sql/new
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles — public-facing user data, 1:1 with auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  bio           text,
  avatar_url    text,
  location      text,
  skills        text[] default '{}',
  rating_avg    numeric(3,2) default 0,
  review_count  int default 0,
  verified      boolean default false,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- -----------------------------------------------------------------------------
-- offerings — what a user can provide
-- -----------------------------------------------------------------------------
create table if not exists public.offerings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text not null,
  category    text not null,
  tags        text[] default '{}',
  image_urls  text[] default '{}',
  status      text default 'active' check (status in ('active','paused','deleted')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists offerings_user_idx on public.offerings (user_id);

-- -----------------------------------------------------------------------------
-- wants — what a user is looking for
-- -----------------------------------------------------------------------------
create table if not exists public.wants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  category    text,
  tags        text[] default '{}',
  status      text default 'active' check (status in ('active','paused','deleted')),
  created_at  timestamptz default now()
);

create index if not exists wants_user_idx on public.wants (user_id);

-- -----------------------------------------------------------------------------
-- opportunities — public listings
-- -----------------------------------------------------------------------------
create table if not exists public.opportunities (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  description     text not null,
  offering_title  text not null,
  offering_desc   text not null,
  offering_tags   text[] default '{}',
  want_title      text not null,
  want_desc       text not null,
  want_tags       text[] default '{}',
  category        text not null,
  image_urls      text[] default '{}',
  view_count      int default 0,
  status          text default 'active' check (status in ('active','paused','closed','completed','deleted')),
  expires_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists opportunities_feed_idx on public.opportunities (status, category, created_at desc);
create index if not exists opportunities_owner_idx on public.opportunities (owner_id);

-- -----------------------------------------------------------------------------
-- interests — seeker expresses interest in an opportunity
-- -----------------------------------------------------------------------------
create table if not exists public.interests (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities(id) on delete cascade,
  seeker_id       uuid not null references public.profiles(id) on delete cascade,
  message         text not null,
  offered_title   text not null,
  offered_desc    text not null,
  status          text default 'pending' check (status in ('pending','seen','declined','withdrawn','converted')),
  created_at      timestamptz default now(),
  seen_at         timestamptz,
  unique (opportunity_id, seeker_id)
);

create index if not exists interests_opportunity_idx on public.interests (opportunity_id, created_at desc);
create index if not exists interests_seeker_idx on public.interests (seeker_id, created_at desc);

-- -----------------------------------------------------------------------------
-- negotiations — the trade thread
-- -----------------------------------------------------------------------------
create table if not exists public.negotiations (
  id                       uuid primary key default gen_random_uuid(),
  opportunity_id           uuid not null references public.opportunities(id) on delete cascade,
  interest_id              uuid not null references public.interests(id) on delete cascade,
  owner_id                 uuid not null references public.profiles(id) on delete cascade,
  seeker_id                uuid not null references public.profiles(id) on delete cascade,
  status                   text not null default 'proposal_sent' check (status in (
    'proposal_sent','counter_sent','both_accepted','in_progress',
    'completed_by_owner','completed_by_seeker','completed',
    'cancelled','expired_inactive','disputed'
  )),
  current_proposal_version int default 1,
  last_action_by           uuid references public.profiles(id),
  last_action_at           timestamptz default now(),
  expires_at               timestamptz,
  created_at               timestamptz default now(),
  unique (interest_id)
);

create index if not exists negotiations_owner_idx on public.negotiations (owner_id, status, last_action_at desc);
create index if not exists negotiations_seeker_idx on public.negotiations (seeker_id, status, last_action_at desc);

-- -----------------------------------------------------------------------------
-- proposals — versioned offers and counter-offers
-- -----------------------------------------------------------------------------
create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  negotiation_id  uuid not null references public.negotiations(id) on delete cascade,
  proposed_by     uuid not null references public.profiles(id) on delete cascade,
  version         int not null,
  owner_gives     text not null,
  seeker_gives    text not null,
  timeline_days   int,
  notes           text,
  status          text default 'pending' check (status in ('pending','accepted','countered','rejected','expired')),
  created_at      timestamptz default now(),
  responded_at    timestamptz,
  unique (negotiation_id, version)
);

create index if not exists proposals_negotiation_idx on public.proposals (negotiation_id, version desc);

-- -----------------------------------------------------------------------------
-- messages — chat within a negotiation
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  negotiation_id  uuid not null references public.negotiations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  type            text default 'text' check (type in ('text','system','proposal_ref')),
  proposal_id     uuid references public.proposals(id) on delete set null,
  created_at      timestamptz default now(),
  read_at         timestamptz
);

create index if not exists messages_negotiation_idx on public.messages (negotiation_id, created_at asc);

-- -----------------------------------------------------------------------------
-- trades — active exchange (created when both parties accept)
-- -----------------------------------------------------------------------------
create table if not exists public.trades (
  id                  uuid primary key default gen_random_uuid(),
  negotiation_id      uuid not null references public.negotiations(id) on delete cascade,
  final_proposal_id   uuid not null references public.proposals(id) on delete restrict,
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  seeker_id           uuid not null references public.profiles(id) on delete cascade,
  status              text default 'in_progress' check (status in (
    'in_progress','completed_by_owner','completed_by_seeker','completed','disputed','cancelled'
  )),
  owner_completed_at  timestamptz,
  seeker_completed_at timestamptz,
  completed_at        timestamptz,
  dispute_reason      text,
  disputed_by         uuid references public.profiles(id),
  dispute_resolved_at timestamptz,
  created_at          timestamptz default now(),
  unique (negotiation_id)
);

create index if not exists trades_owner_idx on public.trades (owner_id, status, created_at desc);
create index if not exists trades_seeker_idx on public.trades (seeker_id, status, created_at desc);

-- -----------------------------------------------------------------------------
-- reviews — one per side per trade
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  trade_id     uuid not null references public.trades(id) on delete cascade,
  reviewer_id  uuid not null references public.profiles(id) on delete cascade,
  reviewee_id  uuid not null references public.profiles(id) on delete cascade,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  tags         text[] default '{}',
  created_at   timestamptz default now(),
  unique (trade_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null,
  reference_id  uuid,
  body          text not null,
  read          boolean default false,
  created_at    timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);
