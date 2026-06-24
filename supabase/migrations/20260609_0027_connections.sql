-- Connections between users: pending → accepted / declined
create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  note         text check (char_length(note) <= 180),
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint no_self_connect check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);

alter table public.connections enable row level security;

create policy "connections_select" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "connections_insert" on public.connections
  for insert with check (auth.uid() = requester_id);

create policy "connections_update" on public.connections
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "connections_delete" on public.connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);

create index connections_requester_idx on public.connections(requester_id);
create index connections_recipient_idx on public.connections(recipient_id);
create index connections_status_idx    on public.connections(status);
