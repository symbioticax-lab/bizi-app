-- =============================================================================
-- Onboarding flow columns
--
-- Adds the answers captured during the first-run onboarding flow. We extend
-- `profiles` rather than creating a side table so matching queries can stay
-- as a single-table read. `skills` (already on profiles) represents what the
-- user can OFFER — we add `skills_wanted` for the inverse side of the trade.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_goal text
    check (onboarding_goal is null or onboarding_goal in (
      'trade_for_services', 'find_collaborators', 'build_portfolio', 'explore'
    )),
  add column if not exists skills_wanted text[] not null default '{}',
  add column if not exists trade_location_pref text
    check (trade_location_pref is null or trade_location_pref in (
      'local', 'remote', 'both'
    )),
  add column if not exists trust_pref text
    check (trust_pref is null or trust_pref in (
      'verified_only', 'open', 'escrow'
    ));

-- GIN index on skills_wanted so the "For You" rail / matching queries can
-- intersect viewer.skills_wanted with other users' skills efficiently.
create index if not exists profiles_skills_wanted_idx
  on public.profiles using gin (skills_wanted);

-- Helpful partial index — most middleware checks will gate on this column.
create index if not exists profiles_onboarding_completed_idx
  on public.profiles (onboarding_completed)
  where onboarding_completed = false;
