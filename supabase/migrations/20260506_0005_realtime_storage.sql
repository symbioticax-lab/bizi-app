-- =============================================================================
-- BIZI MVP — Realtime publication + Storage buckets (apply fifth)
-- =============================================================================

-- Enable realtime change feeds for the tables the client subscribes to.
-- (supabase_realtime publication exists by default in Supabase projects.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- safe to call repeatedly; ignore "already member" errors
    begin alter publication supabase_realtime add table public.negotiations; exception when others then null; end;
    begin alter publication supabase_realtime add table public.messages;     exception when others then null; end;
    begin alter publication supabase_realtime add table public.proposals;    exception when others then null; end;
    begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
    begin alter publication supabase_realtime add table public.interests;    exception when others then null; end;
    begin alter publication supabase_realtime add table public.trades;       exception when others then null; end;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Storage buckets: avatars (public read) and listings (public read).
-- Writes restricted to the owning user's folder.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- Policies: each user can write only to a folder named by their uuid.
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars write own folder" on storage.objects;
create policy "avatars write own folder" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars update own folder" on storage.objects;
create policy "avatars update own folder" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars delete own folder" on storage.objects;
create policy "avatars delete own folder" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listings read" on storage.objects;
create policy "listings read" on storage.objects for select
  using (bucket_id = 'listings');

drop policy if exists "listings write own folder" on storage.objects;
create policy "listings write own folder" on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listings update own folder" on storage.objects;
create policy "listings update own folder" on storage.objects for update
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listings delete own folder" on storage.objects;
create policy "listings delete own folder" on storage.objects for delete
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
