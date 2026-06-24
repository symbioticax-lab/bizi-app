-- =============================================================================
-- Grandfather existing accounts past onboarding.
--
-- Migration 0014 added `onboarding_completed` with a `default false`. That's
-- correct for NEW signups (they should see the onboarding flow), but it also
-- flipped every pre-existing profile to false — forcing returning users
-- through onboarding on their next login.
--
-- Mark every account that already existed when onboarding shipped as done.
-- Anyone created on/after 2026-05-20 is a genuine new signup and keeps
-- onboarding_completed = false.
-- =============================================================================

update public.profiles
set onboarding_completed = true
where created_at < '2026-05-20T00:00:00Z'
  and onboarding_completed = false;
