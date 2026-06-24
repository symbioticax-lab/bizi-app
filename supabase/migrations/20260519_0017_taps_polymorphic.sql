-- =============================================================================
-- Make taps polymorphic — a tap can now target a profile OR a listing.
--
-- The original taps table (migration 0016) was profile-to-profile only. Taps
-- are a brand-new, unreleased feature with no meaningful data, so we drop and
-- recreate rather than carry a fiddly column rename.
--
--   tapper_id    — who tapped
--   owner_id     — the profile that owns the tapped thing (= target_id for a
--                  profile tap; the listing's owner for a listing tap).
--                  Lets the "who tapped you" query stay a single-column read.
--   target_type  — 'profile' | 'listing'
--   target_id    — the profile id or opportunity id
-- =============================================================================

drop table if exists public.taps cascade;

create table public.taps (
  id          uuid primary key default gen_random_uuid(),
  tapper_id   uuid not null references public.profiles(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'listing')),
  target_id   uuid not null,
  seen        boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (tapper_id, target_type, target_id),
  check (tapper_id <> owner_id)
);

create index taps_owner_idx on public.taps (owner_id, created_at desc);

-- RLS — user-managed signal.
alter table public.taps enable row level security;

drop policy if exists taps_read on public.taps;
create policy taps_read on public.taps for select
  using (auth.uid() in (tapper_id, owner_id));

drop policy if exists taps_insert on public.taps;
create policy taps_insert on public.taps for insert
  with check (auth.uid() = tapper_id);

drop policy if exists taps_delete on public.taps;
create policy taps_delete on public.taps for delete
  using (auth.uid() = tapper_id);

drop policy if exists taps_update_seen on public.taps;
create policy taps_update_seen on public.taps for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
