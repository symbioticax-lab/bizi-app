-- =============================================================================
-- BIZI MVP — Bookmarks + folders (Save / Organize)
-- Each user can bookmark profiles and listings. Bookmarks live in a default
-- "All saves" bucket (folder_id = NULL) or in a user-created folder. Folders
-- support `unlisted` visibility (anyone with the share_slug can view).
-- Apply after 0012.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- folders — user-created collections
-- -----------------------------------------------------------------------------
create table if not exists public.folders (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  visibility   text default 'private' check (visibility in ('private','unlisted')),
  share_slug   text unique,
  cover_color  text default '#D4FF3D' check (cover_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists folders_owner_idx on public.folders (owner_id, created_at desc);
create index if not exists folders_share_idx on public.folders (share_slug) where share_slug is not null;

-- Auto-update updated_at on row change
drop trigger if exists trg_folders_updated on public.folders;
create trigger trg_folders_updated before update on public.folders
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- bookmarks — polymorphic save record
-- -----------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_type   text not null check (item_type in ('profile','listing')),
  item_id     uuid not null,
  folder_id   uuid references public.folders(id) on delete set null,
  note        text,
  created_at  timestamptz default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);
create index if not exists bookmarks_folder_idx on public.bookmarks (folder_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.folders enable row level security;
alter table public.bookmarks enable row level security;

-- Folders: owner reads + writes their own. Unlisted folders readable by anyone
-- (the share_slug acts as the access token).
drop policy if exists folders_read on public.folders;
create policy folders_read on public.folders for select
  using (auth.uid() = owner_id or visibility = 'unlisted');

drop policy if exists folders_write_own on public.folders;
create policy folders_write_own on public.folders for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Bookmarks: each user reads their own. Bookmarks inside an unlisted folder
-- are also readable by anyone (so the public share view can render them).
drop policy if exists bookmarks_read on public.bookmarks;
create policy bookmarks_read on public.bookmarks for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.folders f
       where f.id = bookmarks.folder_id
         and f.visibility = 'unlisted'
    )
  );

drop policy if exists bookmarks_write_own on public.bookmarks;
create policy bookmarks_write_own on public.bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Realtime — bookmark + folder changes update the UI live
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.bookmarks; exception when others then null; end;
    begin alter publication supabase_realtime add table public.folders;   exception when others then null; end;
  end if;
end $$;
