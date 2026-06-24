-- =============================================================================
-- Allow users to choose their own username at signup.
-- handle_new_user now uses raw_user_meta_data->>'username' if provided and
-- available; otherwise falls back to the email-derived auto-generation.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  preferred text;
  base_username text;
  candidate text;
  i int := 0;
begin
  -- Use the username chosen by the user on the signup form, if valid and free.
  preferred := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', ''),
    '[^a-z0-9_]', '', 'g'
  ));

  if preferred <> '' and length(preferred) >= 3 and
     not exists (select 1 from public.profiles where username = preferred) then
    candidate := preferred;
  end if;

  -- Fall back to email-derived username when preferred is taken or not provided.
  if candidate is null then
    base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
    if base_username = '' or base_username is null then
      base_username := 'user';
    end if;
    candidate := base_username;
    while exists (select 1 from public.profiles where username = candidate) loop
      i := i + 1;
      candidate := base_username || i::text;
    end loop;
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      candidate
    )
  );
  return new;
end $$;
