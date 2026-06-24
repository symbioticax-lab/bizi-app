-- =============================================================================
-- BIZI MVP — Referral system
-- Adds referral_code (per-profile shareable code) + referred_by_id (who sent
-- the user). Updates handle_new_user to (a) generate a unique 6-char code on
-- signup and (b) capture the referrer when ref_code is supplied via metadata.
-- Apply after 0010.
-- =============================================================================

alter table public.profiles
  add column if not exists referral_code   text unique,
  add column if not exists referred_by_id  uuid references public.profiles(id) on delete set null;

create index if not exists profiles_referred_by_idx on public.profiles (referred_by_id);

-- Backfill any existing rows that don't yet have a referral code.
update public.profiles
   set referral_code = upper(substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 6))
 where referral_code is null;

-- Replace handle_new_user to also generate a referral code + capture referrer.
-- Mirrors the existing username-derivation logic from migration 0002.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username  text;
  candidate      text;
  i              int := 0;
  v_ref_code     text;
  v_referrer_id  uuid;
  v_new_code     text;
begin
  -- Username derivation (unchanged from 0002)
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;

  -- Capture the referrer if signup metadata included a ref_code
  v_ref_code := upper(coalesce(new.raw_user_meta_data->>'ref_code', ''));
  if v_ref_code <> '' then
    select id into v_referrer_id from public.profiles where referral_code = v_ref_code;
  end if;

  -- Generate a unique 6-character referral code (collision-tolerant).
  -- Loop until a fresh code is found — collisions on a 6-char base32-ish space
  -- with N users are negligible (~10M unique codes, billions of years to fill).
  loop
    v_new_code := upper(substr(md5(random()::text || new.id::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = v_new_code);
  end loop;

  insert into public.profiles (id, username, display_name, referral_code, referred_by_id)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', candidate),
    v_new_code,
    v_referrer_id
  );
  return new;
end $$;

-- Note: the existing on_auth_user_created trigger (0002) still points at this
-- function — no need to recreate the trigger itself.
