-- =============================================================================
-- BIZI MVP — Triggers & functions (apply second)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at autoupdate
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_offerings_updated on public.offerings;
create trigger trg_offerings_updated before update on public.offerings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_opportunities_updated on public.opportunities;
create trigger trg_opportunities_updated before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create profile row when a new auth user signs up.
-- Username is derived from email local-part; user can edit later.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  candidate text;
  i int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if base_username = '' or base_username is null then
    base_username := 'user';
  end if;
  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    i := i + 1;
    candidate := base_username || i::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', candidate)
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Recompute reviewee rating when a review is added.
-- -----------------------------------------------------------------------------
create or replace function public.recompute_rating()
returns trigger language plpgsql as $$
begin
  update public.profiles p
  set
    rating_avg = coalesce((select avg(rating)::numeric(3,2) from public.reviews where reviewee_id = p.id), 0),
    review_count = (select count(*) from public.reviews where reviewee_id = p.id)
  where p.id = new.reviewee_id;
  return new;
end $$;

drop trigger if exists trg_reviews_recompute on public.reviews;
create trigger trg_reviews_recompute after insert on public.reviews
  for each row execute function public.recompute_rating();
