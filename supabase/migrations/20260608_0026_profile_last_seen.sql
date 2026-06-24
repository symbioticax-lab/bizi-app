-- Presence: track when each user was last active so the UI can show
-- "Online" / "Online 2h ago" status that updates over time.
alter table public.profiles
  add column if not exists last_seen_at timestamptz default now();

-- Seed existing rows so they don't all read "never seen".
update public.profiles set last_seen_at = coalesce(last_seen_at, updated_at, created_at, now());
