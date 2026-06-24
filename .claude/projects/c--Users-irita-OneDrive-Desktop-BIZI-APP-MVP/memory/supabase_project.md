---
name: BIZI Supabase project
description: Supabase project URL and ref for the BIZI MVP — used for env config and dashboard links
type: reference
---

- Project URL: `https://dkmqkzmkfbmwmywynrbb.supabase.co`
- Project ref: `dkmqkzmkfbmwmywynrbb`
- Dashboard: `https://supabase.com/dashboard/project/dkmqkzmkfbmwmywynrbb`
- SQL editor for applying migrations: `https://supabase.com/dashboard/project/dkmqkzmkfbmwmywynrbb/sql/new`
- Anon key is stored in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe to expose, RLS-protected).
- Service role key is in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (provided 2026-05-06). Bypasses RLS — server-only, never commit, never expose to the browser.
