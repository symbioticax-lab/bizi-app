# BIZI — Barter Marketplace MVP

A trust-based barter platform where users exchange services instead of money.
See [BIZI_PROJECT_PLAN.md](./BIZI_PROJECT_PLAN.md) for the full product spec.

## Status

Sprint 1 (Foundation) complete:
- Next.js 14 App Router + TypeScript + Tailwind + custom theme (black / lime accent)
- Supabase SSR client (browser, server, admin) + auth middleware
- Email/password + Google OAuth, auth callback, signup → profile auto-creation trigger
- Profile CRUD: edit, public `/profile/[username]`, dashboard
- Opportunity detail page (browse/read working; create + interest land in Sprint 2-3)
- Routing skeleton for every route in the plan; placeholder pages for what's coming
- Full SQL migrations + RLS policies + negotiation RPCs (security definer, optimistic locking)
- Storage buckets `avatars` and `listings` with per-user folder write policies
- Realtime publication wired for negotiations / messages / proposals / notifications

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Apply the database migrations

The Next.js app connects to your Supabase project, but the schema must be applied first.

1. Open the SQL editor: <https://supabase.com/dashboard/project/dkmqkzmkfbmwmywynrbb/sql/new>
2. Paste and run each file from `supabase/migrations/` **in order**:
   - `20260506_0001_schema.sql`
   - `20260506_0002_triggers.sql`
   - `20260506_0003_negotiation_rpcs.sql`
   - `20260506_0004_rls.sql`
   - `20260506_0005_realtime_storage.sql`
3. In Supabase **Authentication → Providers**, enable Google OAuth and add the redirect URL:
   `http://localhost:3000/auth/callback` (and your prod URL when deployed).
4. In **Authentication → URL Configuration**, set Site URL to `http://localhost:3000` for now.

## Environment variables

`.env.local` is preconfigured with the anon key. To unlock admin features (cron, server-side
admin APIs) add the **service role** key from Supabase dashboard → Settings → API:

```
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional: transactional email (Resend)

In-app notifications work without any setup. To also send emails for the key
events (interest received, proposal sent, counter sent, deal accepted, trade
completed), add a Resend API key:

1. Sign up at <https://resend.com> (free tier covers 100 emails/day, 3000/month).
2. Create an API key in Resend → API Keys.
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM="BIZI <onboarding@resend.dev>"
   ```
4. The `onboarding@resend.dev` sender works out of the box with no domain verification.
   For production, verify your own domain in Resend and update `RESEND_FROM` to
   `BIZI <noreply@yourdomain.com>`.

If `RESEND_API_KEY` isn't set, all email sends silently no-op — in-app
notifications still fire normally, so dev works fine without it.

## Next sprints

| Sprint | Focus |
|---|---|
| 2 | Listings: create form, image upload, discover filters |
| 3 | Interest flow: express, view, decline, withdraw |
| 4 | Negotiation thread: proposal panel, chat, counter-offer, action bar |
| 5 | Realtime + notifications (in-app + email) |
| 6 | Trades + reviews |
| 7 | Dashboard polish, offerings/wants management, inactivity cron |
| 8 | RLS audit, load test, deploy |
