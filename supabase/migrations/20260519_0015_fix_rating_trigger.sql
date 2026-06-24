-- =============================================================================
-- Fix: rating recompute trigger was blocked by RLS
--
-- `recompute_rating` updates the REVIEWEE's profile row (rating_avg /
-- review_count). It was defined without `security definer`, so it ran with
-- the privileges of the reviewer. The `profiles_update_self` RLS policy only
-- allows `auth.uid() = id`, so a reviewer could never write to the reviewee's
-- row — the UPDATE silently affected 0 rows and ratings never propagated.
--
-- Marking the function `security definer` makes it run as the function owner,
-- bypassing RLS for this controlled, internal write (same pattern as
-- `handle_new_user`).
-- =============================================================================

create or replace function public.recompute_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set
    rating_avg = coalesce(
      (select avg(rating)::numeric(3,2) from public.reviews where reviewee_id = p.id),
      0
    ),
    review_count = (select count(*) from public.reviews where reviewee_id = p.id)
  where p.id = new.reviewee_id;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Backfill: any reviews inserted before this fix never updated their reviewee.
-- Recompute every profile from the reviews table so existing ratings appear.
-- -----------------------------------------------------------------------------
update public.profiles p
set
  rating_avg = coalesce(
    (select avg(rating)::numeric(3,2) from public.reviews where reviewee_id = p.id),
    0
  ),
  review_count = (select count(*) from public.reviews where reviewee_id = p.id);
