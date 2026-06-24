-- =============================================================================
-- BIZI MVP — Phase A.1: hero media + status + per-profile theme columns
-- Foundation for the customizable profile system. Apply after 0009.
-- =============================================================================

alter table public.profiles
  add column if not exists hero_url               text,
  add column if not exists hero_kind              text check (hero_kind in ('image','gif','video')),
  add column if not exists hero_focal_x           numeric(4,3) default 0.500 check (hero_focal_x between 0 and 1),
  add column if not exists hero_focal_y           numeric(4,3) default 0.500 check (hero_focal_y between 0 and 1),
  add column if not exists hero_poster_url        text,                        -- video poster frame
  add column if not exists status                 text default 'online'
    check (status in ('online','available','busy','away')),
  add column if not exists response_time_minutes  int,
  add column if not exists accent_color           text default '#FF6A1A'       -- hex; defaults to the editorial orange from the mockup
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists theme_preset           text default 'editorial'
    check (theme_preset in ('minimal','editorial','cyber','soft_luxury','experimental')),
  add column if not exists theme_overrides        jsonb default '{}'::jsonb;

comment on column public.profiles.accent_color is
  'Hex color used as the per-profile accent. Drives widget area backdrop tint, button fills, status pills.';
comment on column public.profiles.hero_focal_x is 'Horizontal focal point (0-1). object-position uses this so the right part of the image stays visible at any aspect ratio.';
comment on column public.profiles.hero_focal_y is 'Vertical focal point (0-1).';

-- Make sure the storage bucket for hero media exists.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-hero',
  'profile-hero',
  true,
  20 * 1024 * 1024,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies for the new bucket: public read, owner-folder writes.
drop policy if exists "profile-hero read" on storage.objects;
create policy "profile-hero read" on storage.objects for select
  using (bucket_id = 'profile-hero');

drop policy if exists "profile-hero write own folder" on storage.objects;
create policy "profile-hero write own folder" on storage.objects for insert
  with check (
    bucket_id = 'profile-hero'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile-hero update own folder" on storage.objects;
create policy "profile-hero update own folder" on storage.objects for update
  using (
    bucket_id = 'profile-hero'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile-hero delete own folder" on storage.objects;
create policy "profile-hero delete own folder" on storage.objects for delete
  using (
    bucket_id = 'profile-hero'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
