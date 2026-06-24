-- Travel trips: users broadcast where they're going and why
create table public.trips (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  destination        text        not null,
  begin_date         date        not null,
  end_date           date        not null,
  available_for_hire boolean     not null default false,
  purpose            text        not null,
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.trips enable row level security;

-- City feeds are public
create policy "trips_select" on public.trips
  for select using (true);

create policy "trips_insert" on public.trips
  for insert with check (auth.uid() = user_id);

create policy "trips_update" on public.trips
  for update using (auth.uid() = user_id);

create policy "trips_delete" on public.trips
  for delete using (auth.uid() = user_id);

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.touch_updated_at();
