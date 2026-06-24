-- =============================================================================
-- BIZI MVP — Listing drafts
-- Adds 'draft' to opportunities.status. Drafts are owner-only (already covered
-- by RLS — visitors only see active/paused/closed/completed). Apply after 0011.
-- =============================================================================

alter table public.opportunities
  drop constraint if exists opportunities_status_check;

alter table public.opportunities
  add constraint opportunities_status_check
  check (status in ('active', 'paused', 'closed', 'completed', 'deleted', 'draft'));
