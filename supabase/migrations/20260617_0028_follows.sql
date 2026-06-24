create table public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint no_self_follow check (follower_id <> followee_id),
  unique (follower_id, followee_id)
);

create index follows_follower_idx on public.follows(follower_id);
create index follows_followee_idx on public.follows(followee_id);

alter table public.follows enable row level security;

create policy "Anyone can see follows"
  on public.follows for select using (true);

create policy "Follow own rows only"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Unfollow own rows only"
  on public.follows for delete using (auth.uid() = follower_id);
