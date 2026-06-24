-- Direct message threads between connected users.
-- Only accepted connections can create threads (enforced in server actions).
-- Canonical ordering: smaller UUID stored as user1_id prevents duplicate threads.

create table public.dm_threads (
  id          uuid primary key default gen_random_uuid(),
  user1_id    uuid not null references public.profiles(id) on delete cascade,
  user2_id    uuid not null references public.profiles(id) on delete cascade,
  last_msg_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  constraint dm_no_self    check (user1_id <> user2_id),
  constraint dm_users_ordered check (user1_id < user2_id),
  unique (user1_id, user2_id)
);

alter table public.dm_threads enable row level security;

create policy "dm_threads_select" on public.dm_threads
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "dm_threads_insert" on public.dm_threads
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "dm_threads_update" on public.dm_threads
  for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages within a DM thread

create table public.dm_messages (
  id        uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content   text not null check (char_length(content) between 1 and 2000),
  read_at   timestamptz,
  created_at timestamptz not null default now()
);

alter table public.dm_messages enable row level security;

create policy "dm_messages_select" on public.dm_messages
  for select using (
    exists (
      select 1 from public.dm_threads t
       where t.id = thread_id
         and (auth.uid() = t.user1_id or auth.uid() = t.user2_id)
    )
  );

create policy "dm_messages_insert" on public.dm_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.dm_threads t
       where t.id = thread_id
         and (auth.uid() = t.user1_id or auth.uid() = t.user2_id)
    )
  );

create policy "dm_messages_update" on public.dm_messages
  for update using (
    exists (
      select 1 from public.dm_threads t
       where t.id = thread_id
         and (auth.uid() = t.user1_id or auth.uid() = t.user2_id)
    )
  );

create index dm_threads_user1_idx on public.dm_threads(user1_id);
create index dm_threads_user2_idx on public.dm_threads(user2_id);
create index dm_threads_last_msg_idx on public.dm_threads(last_msg_at desc);
create index dm_messages_thread_idx on public.dm_messages(thread_id, created_at asc);

-- Enable realtime change feeds so DMRealtime can subscribe to new messages.
-- (matches the guarded pattern in 20260506_0005_realtime_storage.sql)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.dm_threads;  exception when others then null; end;
    begin alter publication supabase_realtime add table public.dm_messages; exception when others then null; end;
  end if;
end $$;
