# BIZI — Barter Marketplace MVP Project Plan

> A trust-based barter platform where users exchange services instead of money.
> Core product: the negotiation system.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Trade & Negotiation State Machine](#trade--negotiation-state-machine)
6. [API Reference](#api-reference)
7. [Real-Time Features](#real-time-features)
8. [UI Routes & Screen States](#ui-routes--screen-states)
9. [Permissions & Edge Cases](#permissions--edge-cases)
10. [MVP Simplifications](#mvp-simplifications)
11. [Sprint Plan](#sprint-plan)
12. [Scalability Roadmap](#scalability-roadmap)
13. [Key Metrics to Track](#key-metrics-to-track)

---

## Project Overview

**App Name:** BIZI
**Type:** Barter marketplace (no payments, no money)
**Core Loop:**

```
Browse listings → Express Interest → Owner sends Proposal →
Negotiate (counter-offers) → Both Accept → Trade In Progress →
Both Mark Complete → Leave Reviews
```

**Design Principles:**
- Fast, conversational, intuitive UX
- Trust-based — reputation is the currency
- Negotiation system is the core product, not the listing browse

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR for SEO on listings, RSC for performance |
| Styling | Tailwind CSS + shadcn/ui | Speed of development |
| State — Server | TanStack Query (React Query) | Cache, refetch, optimistic updates |
| State — UI | Zustand | Lightweight, for badges/drawers/compose state |
| Forms | React Hook Form + Zod | Type-safe validation |
| Backend | Next.js API Routes | Monolith for MVP simplicity |
| Database | PostgreSQL via Supabase | Relational data + RLS + built-in auth |
| Auth | Supabase Auth | Email/password + Google OAuth, JWT output |
| Real-Time | Supabase Realtime | Postgres change notifications, zero extra infra |
| File Storage | Supabase Storage | Images for profiles and listings |
| Hosting | Vercel (frontend) + Supabase (backend) | Fast deploys, generous free tiers |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  Next.js App Router + React + Tailwind                  │
│  Supabase JS client (auth + realtime subscriptions)     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS + WSS
        ┌────────────┴────────────────┐
        │                             │
┌───────▼────────┐         ┌──────────▼──────────┐
│  Next.js API   │         │  Supabase Realtime   │
│  Routes        │         │  (change events)     │
│  /api/v1/*     │         └──────────────────────┘
└───────┬────────┘
        │ SQL + RLS
┌───────▼────────────────┐
│     PostgreSQL          │
│  (via Supabase)         │
│  Row Level Security     │
└─────────────────────────┘
        │
┌───────▼────────┐
│ Supabase       │
│ Storage        │
│ (images)       │
└────────────────┘
```

**Why monolith for MVP:** The negotiation logic is relational and transactional. Splitting into microservices adds distributed transaction complexity with no benefit at this scale.

---

## Database Schema

### `users`
Managed by Supabase Auth automatically.

```sql
id          uuid PRIMARY KEY
email       text UNIQUE NOT NULL
created_at  timestamptz
```

---

### `profiles`

```sql
id              uuid PRIMARY KEY REFERENCES users(id)
username        text UNIQUE NOT NULL
display_name    text NOT NULL
bio             text
avatar_url      text
location        text                    -- city/region only
skills          text[]                  -- ["web design", "photography"]
rating_avg      numeric(3,2) DEFAULT 0
review_count    int DEFAULT 0
verified        boolean DEFAULT false
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

---

### `offerings` — what a user can provide

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES profiles(id)
title       text NOT NULL
description text NOT NULL
category    text NOT NULL
tags        text[]
image_urls  text[]
status      text DEFAULT 'active'       -- active | paused | deleted
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

---

### `wants` — what a user is looking for in exchange

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES profiles(id)
title       text NOT NULL
description text
category    text
tags        text[]
status      text DEFAULT 'active'
created_at  timestamptz DEFAULT now()
```

---

### `opportunities` — public listings

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
owner_id        uuid NOT NULL REFERENCES profiles(id)
title           text NOT NULL
description     text NOT NULL
-- What the poster offers
offering_title  text NOT NULL
offering_desc   text NOT NULL
offering_tags   text[]
-- What the poster wants in return
want_title      text NOT NULL
want_desc       text NOT NULL
want_tags       text[]
-- Meta
category        text NOT NULL
image_urls      text[]
view_count      int DEFAULT 0
status          text DEFAULT 'active'   -- active | paused | closed | completed
expires_at      timestamptz             -- null = no expiry
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()

INDEX ON (status, category, created_at DESC)
INDEX ON (owner_id)
```

---

### `interests` — seeker expresses interest in an opportunity

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
opportunity_id  uuid NOT NULL REFERENCES opportunities(id)
seeker_id       uuid NOT NULL REFERENCES profiles(id)
message         text NOT NULL
offered_title   text NOT NULL           -- brief label of what seeker brings
offered_desc    text NOT NULL
status          text DEFAULT 'pending'  -- pending | seen | declined | withdrawn | converted
created_at      timestamptz DEFAULT now()
seen_at         timestamptz

UNIQUE (opportunity_id, seeker_id)      -- prevents duplicate interest
```

---

### `negotiations` — the trade thread

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
opportunity_id  uuid NOT NULL REFERENCES opportunities(id)
interest_id     uuid NOT NULL REFERENCES interests(id)
owner_id        uuid NOT NULL REFERENCES profiles(id)
seeker_id       uuid NOT NULL REFERENCES profiles(id)
status          text NOT NULL DEFAULT 'proposal_pending'
-- States: proposal_pending | proposal_sent | counter_sent
--         owner_accepted | both_accepted | in_progress
--         completed_by_owner | completed_by_seeker | completed
--         cancelled | expired_inactive | disputed
current_proposal_version  int DEFAULT 0
last_action_by  uuid REFERENCES profiles(id)
last_action_at  timestamptz DEFAULT now()
expires_at      timestamptz
created_at      timestamptz DEFAULT now()

UNIQUE (interest_id)                    -- one negotiation per interest
```

---

### `proposals` — versioned offers and counter-offers

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
negotiation_id  uuid NOT NULL REFERENCES negotiations(id)
proposed_by     uuid NOT NULL REFERENCES profiles(id)
version         int NOT NULL
-- Terms
owner_gives     text NOT NULL
seeker_gives    text NOT NULL
timeline_days   int
notes           text
-- Lifecycle
status          text DEFAULT 'pending'  -- pending | accepted | countered | rejected | expired
created_at      timestamptz DEFAULT now()
responded_at    timestamptz

UNIQUE (negotiation_id, version)
INDEX ON (negotiation_id, version DESC)
```

---

### `messages` — chat within a negotiation

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
negotiation_id  uuid NOT NULL REFERENCES negotiations(id)
sender_id       uuid NOT NULL REFERENCES profiles(id)
content         text NOT NULL
type            text DEFAULT 'text'     -- text | system | proposal_ref
proposal_id     uuid REFERENCES proposals(id)
created_at      timestamptz DEFAULT now()
read_at         timestamptz

INDEX ON (negotiation_id, created_at ASC)
```

---

### `trades` — active exchange record (created at both_accepted)

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
negotiation_id      uuid NOT NULL REFERENCES negotiations(id)
final_proposal_id   uuid NOT NULL REFERENCES proposals(id)
owner_id            uuid NOT NULL REFERENCES profiles(id)
seeker_id           uuid NOT NULL REFERENCES profiles(id)
status              text DEFAULT 'in_progress'
-- in_progress | completed_by_owner | completed_by_seeker | completed | disputed
owner_completed_at  timestamptz
seeker_completed_at timestamptz
completed_at        timestamptz
dispute_reason      text
disputed_by         uuid REFERENCES profiles(id)
dispute_resolved_at timestamptz
created_at          timestamptz DEFAULT now()
```

---

### `reviews`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
trade_id        uuid NOT NULL REFERENCES trades(id)
reviewer_id     uuid NOT NULL REFERENCES profiles(id)
reviewee_id     uuid NOT NULL REFERENCES profiles(id)
rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5)
comment         text
tags            text[]    -- ["professional", "delivered fast", "great communicator"]
created_at      timestamptz DEFAULT now()

UNIQUE (trade_id, reviewer_id)          -- one review per side per trade
```

---

### `notifications`

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
type            text
-- interest_received | proposal_sent | counter_sent |
-- both_accepted | trade_completed | review_received
reference_id    uuid                    -- negotiation_id or trade_id
body            text
read            boolean DEFAULT false
created_at      timestamptz DEFAULT now()

INDEX ON (user_id, read, created_at DESC)
```

---

### Entity Relationships

```
profiles ──< opportunities
profiles ──< offerings
profiles ──< wants
opportunities ──< interests
profiles ──< interests (as seeker)
interests ──── negotiations (1:1)
negotiations ──< proposals
negotiations ──< messages
negotiations ──── trades (1:1)
trades ──< reviews
```

---

## Trade & Negotiation State Machine

### Full State Diagram

```
[Opportunity Active]
        │
        │  seeker submits interest
        ▼
  ┌─────────────┐
  │  INTEREST   │◄── seeker can WITHDRAW
  │   PENDING   │
  └──────┬──────┘
         │ owner views → SEEN
         │ owner can DECLINE ──────────────────────────────► [DECLINED]
         │ owner sends first proposal
         ▼
  ┌──────────────┐
  │  PROPOSAL    │   (owner_gives X, seeker_gives Y, version=1)
  │    SENT      │
  └──────┬───────┘
         │
    ┌────┴──────────────────────────┐
    │                               │
    │ seeker ACCEPTS                │ seeker COUNTERS
    ▼                               ▼
┌──────────────┐           ┌──────────────┐
│    BOTH      │           │   COUNTER    │◄──────┐
│  ACCEPTED    │           │    SENT      │       │
└──────┬───────┘           └──────┬───────┘       │
       │                          │               │
       │                     ┌────┴──────┐        │
       │                     │           │        │
       │                owner        owner        │
       │                ACCEPTS      COUNTERS ────┘
       │                     │       (new version, loops)
       │                     │
       │               ┌─────▼───────┐
       │               │    BOTH     │
       └──────────────►│  ACCEPTED   │
                       └─────┬───────┘
                             │ system creates Trade record
                             ▼
                     ┌───────────────┐
                     │  IN PROGRESS  │
                     └──────┬────────┘
                            │
               ┌────────────┴────────────┐
          owner marks                seeker marks
           complete                   complete
               │                         │
               ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │ COMPLETED (owner) │     │ COMPLETED (seeker)│
    └─────────┬─────────┘     └─────────┬─────────┘
              │   other side completes  │
              └─────────────┬───────────┘
                            ▼
                   ┌────────────────┐
                   │   COMPLETED    │
                   │   (both sides) │
                   └────────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ REVIEW PHASE  │  (14-day window, then auto-closes)
                    └───────────────┘

CANCELLATION (from most states):
  Any party can cancel from: PROPOSAL_SENT, COUNTER_SENT
  Owner can cancel from:     INTEREST_PENDING
  IN_PROGRESS cancellation:  requires other party to confirm within 72h
                        │
                        ▼
                  [CANCELLED]

DISPUTE (from IN_PROGRESS or COMPLETED_ONE_SIDE):
                        │
                        ▼
                  [DISPUTED] ── MVP: flag + email admin, no automated resolution
```

---

### Who Can Act at Each Step

| State | Owner Can | Seeker Can |
|---|---|---|
| INTEREST_PENDING | Decline, Send Proposal | Withdraw |
| PROPOSAL_SENT | (wait) | Accept, Counter, Decline |
| COUNTER_SENT | Accept, Counter, Decline | (wait) |
| BOTH_ACCEPTED | (auto-transitions) | (auto-transitions) |
| IN_PROGRESS | Mark Complete, Open Dispute | Mark Complete, Open Dispute |
| COMPLETED_ONE_SIDE | Mark Complete (if seeker went first) | Mark Complete (if owner went first) |
| COMPLETED_BOTH | Leave Review | Leave Review |

**Key rule:** Only the party that did NOT send the last proposal can act on it. `last_action_by` on the negotiations record enforces this server-side.

---

### Proposal Versioning & Conflict Prevention

```
Server-side logic for counter-offer submission:

1. SELECT current_proposal_version FROM negotiations WHERE id = ? FOR UPDATE
2. Verify incoming request includes correct version (optimistic lock)
3. INSERT new proposal with version = current + 1
4. UPDATE negotiations SET
     current_proposal_version = new_version,
     last_action_by = proposer_id,
     status = 'counter_sent'
5. Mark previous proposal status = 'countered'

FOR UPDATE row lock prevents race conditions.
```

---

### Inactivity Handling

```
Day 0:   Negotiation created
Day 7:   Cron job → reminder notification to both parties
Day 14:  Cron job → second reminder
Day 21:  Auto-expire → status = 'expired_inactive'
         Opportunity listing remains active
         Seeker can re-submit interest fresh
```

---

## API Reference

All endpoints prefixed `/api/v1`. Auth via `Authorization: Bearer <jwt>`.

---

### Opportunities

```
GET    /opportunities
  Query: ?category=&tags=&q=&page=&limit=20
  Response: { data: Opportunity[], total, page, hasMore }

POST   /opportunities
  Body: { title, description, offering_title, offering_desc,
          want_title, want_desc, category, tags[], image_urls[] }
  Response: { id, ...opportunity }

GET    /opportunities/:id
  Response: { ...opportunity, owner: Profile, interest_count }

PATCH  /opportunities/:id
  Body: partial Opportunity fields (must be owner)

DELETE /opportunities/:id
  Effect: sets status = 'deleted'

PATCH  /opportunities/:id/status
  Body: { status: 'active' | 'paused' }
```

---

### Interests

```
POST   /opportunities/:id/interests
  Body: { message, offered_title, offered_desc }
  Validates: no existing active interest from this seeker
  Response: { id, status: 'pending', created_at }

GET    /opportunities/:id/interests
  Auth: opportunity owner only
  Response: { data: [{ interest, seeker: Profile }] }

PATCH  /interests/:id/decline
  Auth: opportunity owner only
  Effect: interest.status = 'declined', notifies seeker

DELETE /interests/:id
  Auth: seeker only — withdraws interest
```

---

### Negotiations

```
POST   /interests/:id/negotiations
  Auth: opportunity owner only
  Body: { owner_gives, seeker_gives, timeline_days?, notes? }
  Effect: creates negotiation + first proposal (v=1) + system message
  Response: { negotiation_id, proposal_id }

GET    /negotiations
  Query: ?status=&role=owner|seeker
  Response: { data: [{ negotiation, opportunity, counterpart: Profile,
                        latest_proposal, unread_count }] }

GET    /negotiations/:id
  Response: { negotiation, opportunity, owner, seeker,
               proposals: [], messages: [] }

POST   /negotiations/:id/proposals
  Body: { owner_gives, seeker_gives, timeline_days?, notes?, current_version }
  Validates: current user is NOT last_action_by
  Validates: current_version matches negotiation (optimistic lock)
  Effect: inserts proposal, updates negotiation status + version
  Response: { proposal_id, version }

POST   /negotiations/:id/proposals/:proposal_id/accept
  Validates: proposal is at current version
  Validates: current user is NOT the proposer
  Effect: proposal.status = 'accepted', negotiation.status = 'both_accepted',
          creates trade record, notifies both parties
  Response: { trade_id }

POST   /negotiations/:id/cancel
  Body: { reason? }
  Effect: negotiation.status = 'cancelled', notifies counterpart
```

---

### Trades

```
GET    /trades
  Query: ?status=in_progress|completed|disputed
  Response: { data: Trade[] with participants }

GET    /trades/:id
  Response: { trade, final_proposal, owner, seeker,
               owner_review?, seeker_review? }

POST   /trades/:id/complete
  Effect: sets owner_completed_at or seeker_completed_at
          If both set → status = 'completed', completed_at = now()
  Response: { status }

POST   /trades/:id/dispute
  Body: { reason }
  Effect: status = 'disputed', alert sent to admin email
```

---

### Messages

```
GET    /negotiations/:id/messages
  Query: ?before=<message_id>&limit=50
  Response: { data: Message[], hasMore }
  Side effect: marks messages as read

POST   /negotiations/:id/messages
  Body: { content, type?: 'text' }
  Response: { message_id, created_at }
```

---

### Reviews

```
POST   /trades/:id/reviews
  Body: { rating, comment, tags[] }
  Validates: trade.status = 'completed', no existing review by this user
  Response: { review_id }

GET    /profiles/:username/reviews
  Query: ?page=&limit=10
  Response: { data: Review[], rating_avg, review_count }
```

---

### Dashboard

```
GET    /dashboard
  Response:
  {
    profile: Profile,
    stats: {
      active_opportunities: int,
      active_negotiations: int,
      completed_trades: int,
      rating_avg: float,
      review_count: int
    },
    recent_activity: [
      { type: string, reference_id, created_at, counterpart: Profile }
    ],
    offerings: Offering[],
    wants: Want[]
  }
```

---

## Real-Time Features

### Events That Need Real-Time Delivery

| Event | Recipient | Trigger |
|---|---|---|
| Interest received | Opportunity owner | INSERT on interests |
| Interest seen | Seeker | UPDATE interests.seen_at |
| Proposal sent | Recipient | INSERT on proposals |
| Counter sent | Recipient | INSERT on proposals |
| Trade accepted | Both parties | UPDATE negotiations.status = both_accepted |
| Message received | Other party | INSERT on messages |
| Trade marked complete | Other party | UPDATE trades |

---

### Implementation — Supabase Realtime (MVP)

```typescript
// Subscribe to a negotiation thread
const channel = supabase
  .channel(`negotiation:${negotiationId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'negotiations',
    filter: `id=eq.${negotiationId}`,
  }, () => {
    queryClient.invalidateQueries(['negotiation', negotiationId])
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `negotiation_id=eq.${negotiationId}`,
  }, () => {
    queryClient.invalidateQueries(['messages', negotiationId])
  })
  .subscribe()

// Global notification badge
const notifChannel = supabase
  .channel(`user-notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    notificationStore.increment()
    toast(payload.new.body)
  })
  .subscribe()
```

**Post-MVP upgrade path:** When Supabase Realtime becomes a bottleneck, migrate to a dedicated Socket.io service with Redis pub/sub adapter. Client-side subscription code changes minimally.

---

## UI Routes & Screen States

### Route Map

```
/                          → Discover (opportunity feed)
/opportunities/new         → Create Listing
/opportunities/:id         → Opportunity Detail
/profile/:username         → Public Profile
/profile/edit              → Edit Profile
/dashboard                 → My Dashboard
/negotiations              → Negotiations List
/negotiations/:id          → Negotiation Thread  ← CORE PRODUCT SCREEN
/trades                    → Active & Past Trades
/trades/:id                → Trade Detail
/notifications             → All Notifications
```

---

### Key Screen State Maps

#### Discover (`/`)

```
loading       → skeleton cards (12 placeholders)
empty/search  → "No results for X" + suggested categories
empty/first   → "Be the first to post in this category"
populated     → grid of OpportunityCards with filter bar
error         → "Couldn't load listings. Retry."

Data: GET /opportunities (paginated, filterable)
      Current user profile (for "Express Interest" vs "Edit" CTA)
```

#### Opportunity Detail (`/opportunities/:id`)

```
loading           → full-page skeleton
not_found         → 404 with suggestions
own_listing       → Manage controls + interest list
other_listing     → "Express Interest" CTA
already_interested → "Interest Sent — Pending" badge
declined          → "Not a match — try another listing"

Data: GET /opportunities/:id
      GET /interests (if owner)
      GET /interests?my=true (if seeker, to check status)
```

#### Negotiation Thread (`/negotiations/:id`) — core screen

```
LAYOUT:
  1. Header bar:     opportunity title | counterpart avatar | status badge
  2. Proposal panel: current terms of the deal (sticky top)
  3. Message thread: scrollable mix of chat + system events
  4. Action bar:     context-sensitive bottom bar

ACTION BAR STATES BY ROLE:
  owner, awaiting_seeker:
    → Disabled — "Waiting for [seeker name]..."
  seeker, proposal_received:
    → [Accept Deal] [Counter Offer] [Decline]
  seeker, counter_sent:
    → Disabled — "Waiting for [owner name]..."
  owner, counter_received:
    → [Accept Deal] [Counter Offer] [Decline]
  in_progress:
    → [Mark as Complete] [Open Dispute]
  completed_one_side (you completed):
    → "Waiting for [name] to confirm completion"
  completed_both:
    → "Trade complete! Leave a review." + review form

Data: GET /negotiations/:id
      Realtime subscription (negotiations + messages tables)
```

#### Dashboard (`/dashboard`)

```
new_user    → onboarding prompt: "Add your first offering to get started"
populated   → stats strip + offerings panel + wants panel + activity feed
loading     → per-panel skeletons (load in parallel)

Panels:
  Stats:    Active listings | Active negotiations | Completed trades | Rating
  Offerings: list with status badges + edit/pause/delete actions
  Wants:     list + add new button
  Activity:  notification-style feed of recent events
```

---

## Permissions & Edge Cases

### Duplicate Interest Prevention

```sql
-- Database constraint (enforced at DB level, not just app level)
UNIQUE (opportunity_id, seeker_id) ON interests

-- API behavior:
-- Declined/withdrawn seekers CAN re-submit after 24-hour cooling period
-- Check: status NOT IN ('declined', 'withdrawn') OR seen_at < now() - interval '24h'
```

### Ghosting / Inactivity Rules

```
Day 0:   Negotiation created
Day 7:   Cron → "Your negotiation with [name] is waiting" (both parties)
Day 14:  Cron → second reminder
Day 21:  Auto-expire → status = 'expired_inactive'
         Opportunity listing remains active
         Seeker can re-submit fresh interest
```

### Trade Cancellation Rules

| State | Cancellation Rule |
|---|---|
| INTEREST_PENDING | Owner can decline unilaterally |
| PROPOSAL_SENT / COUNTER_SENT | Either party can cancel, no penalty |
| IN_PROGRESS | One party requests, other must confirm within 72h |
| COMPLETED_ONE_SIDE | Locked — must go through dispute flow |

### Dispute Handling (MVP — intentionally simple)

```
- Either party can open dispute from IN_PROGRESS or COMPLETED_ONE_SIDE
- Requires written reason (minimum 100 characters)
- System emails admin with full negotiation + trade context
- Admin manually resolves: mark trade completed or cancelled
- Fields: disputed_by, dispute_reason, dispute_resolved_at on trades table
- Post-MVP: structured arbitration workflow
```

### Additional Edge Cases

| Scenario | Handling |
|---|---|
| Owner edits listing after negotiation starts | Lock opportunity editing once active negotiation exists (API returns 409) |
| Seeker interests in multiple listings | Allowed — normal behavior, no restriction |
| User deletes account mid-trade | Soft delete only (is_active = false). Active trades remain visible as "[User deactivated]". Admin alerted. |
| Duplicate/spam listings | Report button → flags for admin review. No automated dedup in MVP. |
| Both parties counter simultaneously | FOR UPDATE row lock + optimistic version check prevents race. One wins, other gets conflict error and must re-submit. |

---

## MVP Simplifications

These are intentionally out of scope for v1:

| Feature | MVP Approach | Why Deferred |
|---|---|---|
| Dispute resolution | Email admin, manual resolution | Full arbitration is a product in itself |
| Category taxonomy | Flat list of ~12 categories | Nested taxonomy adds complexity without signal |
| Opportunity expiry enforcement | Optional field, no auto-close | Set up infra first, validate need |
| Wants matching / suggestions | Users add wants, no auto-matching | Algorithm needs data to be useful |
| Push notifications (mobile) | In-app + email only | Requires native app or PWA setup |
| Media in messages | Text only | S3 + virus scanning complexity |
| Multi-image listing carousel | 1 image per listing | Simplifies upload UX |
| Trade milestone tracking | Single "mark complete" toggle | Milestones need domain knowledge to design |
| Trust / ID verification | Email verified badge only | ID verification = compliance rabbit hole |
| Search relevance ranking | Chronological + category filter | Need data before tuning relevance |
| Multiple negotiations per opportunity | One active negotiation at a time | Fan-out state machine is complex |
| Payments / escrow | None — pure barter | Not in scope by design |

---

## Sprint Plan

### Critical Path: 8 Weeks

```
Week 1-2:  Foundation
           ├── Supabase project setup + schema migrations
           ├── Auth (email + Google OAuth)
           ├── Profile CRUD
           └── Basic layout + routing

Week 2-3:  Listings
           ├── Opportunities CRUD
           ├── Discover page (browse + filter)
           ├── Opportunity detail page
           └── Image upload (Supabase Storage)

Week 3-4:  Interest Flow
           ├── Express interest form
           ├── Owner views interests
           ├── Accept / decline interest
           └── Notifications for interest received

Week 4-5:  Negotiation Thread  ← HIGHEST RISK / HIGHEST VALUE
           ├── Negotiation creation (owner sends first proposal)
           ├── Proposal state machine (all transitions)
           ├── Counter-offer versioning + optimistic locking
           ├── Chat messages within negotiation
           └── Action bar with context-aware CTAs

Week 5-6:  Real-Time + Notifications
           ├── Supabase Realtime subscriptions (negotiations + messages)
           ├── In-app notification center
           ├── Notification badge (global)
           └── Email notifications (interest received, proposal sent, accepted)

Week 6-7:  Trades + Reviews
           ├── Trade record creation on both_accepted
           ├── Mark complete flow (both-sides confirmation)
           ├── Review submission + display
           └── Rating aggregation on profiles

Week 7-8:  Dashboard + Polish
           ├── Dashboard (stats, offerings, wants, activity)
           ├── Offerings and Wants management
           ├── Inactivity cron jobs
           ├── Edge case hardening (all the cases in Section 9)
           └── Mobile responsiveness pass

Week 8:    Pre-Launch
           ├── Supabase RLS policy audit (every table)
           ├── API auth check audit (every endpoint)
           ├── Load test negotiation endpoints
           └── Deploy: Vercel + Supabase production
```

**Note:** Weeks 4-5 (Negotiation Thread) are the riskiest and most valuable sprint. Front-load it with your best engineer. Test every state transition explicitly before moving on.

---

## Scalability Roadmap

### Current Limits & Upgrade Paths

**Database**
```
MVP:    Supabase free (500MB, 2 connections)
Growth: Supabase Pro ($25/mo, PgBouncer connection pooling)
Scale:  Read replicas for opportunity listings
        Typesense / pg_trgm for full-text search
```

**Real-Time**
```
MVP:    Supabase Realtime (fine for ~1k concurrent users)
Growth: Dedicated Socket.io server + Redis pub/sub
Scale:  Redis Streams for durable event log, Socket.io cluster
```

**Opportunity Feed (hot read path)**
```
MVP:    Direct DB query with pagination
Growth: Redis cache (5-min TTL) for first 3 pages per category
Scale:  Separate read-optimized listings service + ElasticSearch
```

**Images**
```
MVP:    Supabase Storage (5GB free)
Growth: Cloudinary (on-the-fly transforms, CDN, WebP)
Scale:  S3 + CloudFront + image transform Lambda
```

**Negotiation State Machine**
```
Keep logic server-side — never in client code.
This makes it auditable, testable, and safe to evolve.
Post-MVP: Temporal.io if you add complex timeouts, retries,
          or multi-party trades.
```

### Post-MVP Feature Unlock Order

```
1.  Search improvement        (Typesense, tags, geolocation filters)
2.  Mobile PWA + push         (service workers, push notifications)
3.  Trust badges              (verified identity, social proof)
4.  Automated matching        (wants → opportunity suggestions via embeddings)
5.  Multi-leg trades          (A gives B → B gives C → C gives A — barter rings)
6.  Structured dispute flow   (arbitration system)
7.  Community features        (follows, reputation feed)
```

---

## Key Metrics to Track

Track these from Day 1 to understand product health:

| Metric | Formula | What It Tells You |
|---|---|---|
| Interest-to-deal rate | negotiations_created / interests_created | Conversion from browse to real engagement |
| Avg proposals per negotiation | sum(version) / count(negotiations) | Negotiation friction |
| Ghosting rate | expired_inactive / negotiations_created | Trust/follow-through health |
| Trade completion rate | completed / in_progress | Fulfillment reliability |
| Time to first proposal | avg(negotiation.created_at - interest.created_at) | Owner responsiveness |
| Review rate | reviews_submitted / completed_trades | Engagement post-trade |
| p95 latency on GET /negotiations/:id | APM tool | Core product performance |

---

*Last updated: May 2026 — MVP scope*
