-- =============================================================================
-- BIZI MVP — Negotiable flag on opportunities + storage size limits
-- Apply after 0001-0005.
-- =============================================================================

-- 1. Negotiable flag on opportunities ----------------------------------------
-- TRUE  → seekers can submit counter-offers (default; matches platform's barter ethos)
-- FALSE → take it or leave it; seeker can only Accept or Decline the owner's proposal
alter table public.opportunities
  add column if not exists negotiable boolean not null default true;

comment on column public.opportunities.negotiable is
  'When false, seekers cannot submit counter-offers — only Accept or Decline. Enforced in negotiation RPCs.';

-- 2. Bump storage upload limits (default project cap is generous; this scopes per-bucket)
update storage.buckets
   set file_size_limit = 20 * 1024 * 1024,        -- 20 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id in ('listings','avatars');
