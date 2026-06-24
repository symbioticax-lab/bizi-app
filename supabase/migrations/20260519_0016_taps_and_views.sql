-- =============================================================================
-- Taps + content views
--
-- taps          — a lightweight "I'm interested in you" signal. Profiles only.
--                 One row per (tapper, tapped); tapping again removes it.
-- content_views — deduped record of who looked at a profile or a listing.
--                 One row per (viewer, target); a repeat view bumps viewed_at
--                 and re-flags it unseen.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- taps
-- -----------------------------------------------------------------------------
create table if not exists public.taps (
  id          uuid primary key default gen_random_uuid(),
  tapper_id   uuid not null references public.profiles(id) on delete cascade,
  tapped_id   uuid not null references public.profiles(id) on delete cascade,
  seen        boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (tapper_id, tapped_id),
  check (tapper_id <> tapped_id)
);

create index if not exists taps_tapped_idx on public.taps (tapped_id, created_at desc);

-- -----------------------------------------------------------------------------
-- content_views
-- -----------------------------------------------------------------------------
create table if not exists public.content_views (
  id          uuid primary key default gen_random_uuid(),
  viewer_id   uuid not null references public.profiles(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'listing')),
  target_id   uuid not null,
  seen        boolean not null default false,
  viewed_at   timestamptz not null default now(),
  unique (viewer_id, target_type, target_id),
  check (viewer_id <> owner_id)
);

create index if not exists content_views_owner_idx on public.content_views (owner_id, viewed_at desc);

-- -----------------------------------------------------------------------------
-- RLS: taps — user-managed, so explicit allow rules.
-- -----------------------------------------------------------------------------
alter table public.taps enable row level security;

drop policy if exists taps_read on public.taps;
create policy taps_read on public.taps for select
  using (auth.uid() in (tapper_id, tapped_id));

drop policy if exists taps_insert on public.taps;
create policy taps_insert on public.taps for insert
  with check (auth.uid() = tapper_id);

drop policy if exists taps_delete on public.taps;
create policy taps_delete on public.taps for delete
  using (auth.uid() = tapper_id);

drop policy if exists taps_update_seen on public.taps;
create policy taps_update_seen on public.taps for update
  using (auth.uid() = tapped_id) with check (auth.uid() = tapped_id);

-- -----------------------------------------------------------------------------
-- RLS: content_views — service-role only.
-- View tracking (upserts) and the "who viewed you" reads all run through the
-- service-role client in server code, so no public policies are defined.
-- -----------------------------------------------------------------------------
alter table public.content_views enable row level security;
