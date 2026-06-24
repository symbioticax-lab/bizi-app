create table public.trip_session_requests (
  id            uuid        primary key default gen_random_uuid(),
  trip_id       uuid        not null references public.trips(id) on delete cascade,
  requester_id  uuid        not null references auth.users(id) on delete cascade,
  traveler_id   uuid        not null references auth.users(id) on delete cascade,
  type          text        not null default 'session',  -- 'session' | 'connect'
  proposed_date date,
  message       text,
  status        text        not null default 'pending',  -- 'pending' | 'accepted' | 'declined'
  created_at    timestamptz not null default now()
);

alter table public.trip_session_requests enable row level security;

create policy "participants can read" on public.trip_session_requests
  for select using (auth.uid() = traveler_id or auth.uid() = requester_id);

create policy "requester can insert" on public.trip_session_requests
  for insert with check (auth.uid() = requester_id);

create policy "traveler can update status" on public.trip_session_requests
  for update using (auth.uid() = traveler_id);
