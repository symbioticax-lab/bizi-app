# BIZI Monetization Strategy — Paywall, Pricing & Subscription Design

## Context
BIZI is a trust-based barter marketplace with a rich feature set (listings, negotiations, trades, messaging, taps, bookmarks, profiles/themes, reviews, travel/trips + session requests, journey/referral gamification) and **zero billing infrastructure today**. The goal: introduce monetization that maximizes conversion and monthly spend *without strangling the two-sided marketplace*. In a nascent marketplace, listing supply is oxygen — so we monetize **visibility, status, scale, and convenience**, never the ability to transact.

This document is the strategy + phased implementation roadmap. Numbers are specific and chosen for behavioral effect (anchoring, decoy, loss aversion, charm pricing).

---

## Guiding Principle: What We Gate vs. What Stays Free Forever

**NEVER gate (protects liquidity & GMV):** browsing, expressing interest, negotiating, in-trade messaging, completing trades, leaving/receiving reviews, basic profile, receiving taps. If a user can't transact for free, the network dies and there's nothing to monetize.

**Gate / meter (status, scale, visibility, convenience):** number of live listings, listing longevity, boosts/featured placement, multi-image & video, analytics ("who viewed you"), verification badge, premium themes, advanced search/AI matching, travel reach, send-side volume (taps/session requests), saved-search alerts.

---

## Layer 1 — The Free Tier (the liquidity floor)

Generous enough to seed supply, bounded enough that any *active* user hits a wall.

| Feature | Free limit |
|---|---|
| **Listings** | **3 published listings per rolling 30 days**, each live **14 days**, then auto-expires |
| Listing images | **1** image per listing |
| Boosts / featured | none (buy à la carte) |
| Analytics | counts only (views/taps numbers, **identities blurred**) |
| "Who viewed you" (`/views`) | count only; names locked |
| Verification badge | not included (buy à la carte $9.99) |
| Profile themes | **2** presets (minimal, editorial); fixed accent color |
| Saved folders | **3** folders, private only |
| Taps (send) | **10/day** |
| Travel: active trips | **1** |
| Travel: session requests sent | **3 / month** |
| Discovery/search | location + sort only (no full-text, no saved searches) |
| Negotiate / message / review / express interest | **Unlimited, free forever** |

---

## Layer 2 — À La Carte (pay-per-listing) — the anchor that sells the subscription

Refined from your model, tuned so the math pushes toward Pro.

- **Extra listing** (beyond the 3 free): **$4.99** → live **14 days**.
- **After day 14:** auto-renews at **$0.37/day** *only if the user opts to keep it live* — a reminder is sent at day 12 and day 14 with a one-tap **"Keep it live"** / **"Let it expire"** choice. Default = expire (so we get an explicit, low-friction yes — and the daily charge never feels like a surprise/trap).
- **Boost (bump to top of feed, 24h):** **$1.99**
- **Featured (7-day pinned + badge in a city/category):** **$6.99**
- **Verification badge (one-time ID check):** **$9.99**
- **Theme pack unlock (one-time):** **$2.99**

**The deliberate math (anchoring + decoy):**
- One listing kept live a full month = $4.99 + 16 × $0.37 = **$10.91**.
- Three paid à la carte listings/month = **$14.97**.
- → **Pro at $9.99/mo (unlimited listings) becomes the obvious choice after the *second* paid listing or the *first* listing you want to keep past two weeks.** The à la carte prices exist largely to make the subscription feel free.

---

## Layer 3 — Subscriptions (3 visible options: Free / Pro / Elite)

Three tiers only (avoid choice overload). Pro is the target; Elite anchors Pro as "the sensible one."

### BIZI Pro — **$9.99/mo** or **$89/yr** (~$7.42/mo, "2.6 months free")
- **Unlimited** listings, each 14-day, **free unlimited renewals** (no per-day fee)
- **5 images** per listing
- **2 boosts/month** included
- **Full analytics** + unblurred "who viewed you"
- **All 5 themes** + accent color picker
- **Unlimited** saved folders (shareable) & **saved searches** + full-text search
- Taps: **50/day**; Travel: **5 active trips**, unlimited session requests
- **50% off verification** ($4.99)
- Eligible for organic "Featured in Discover" rotation
- Pro badge on profile

### BIZI Elite — **$19.99/mo** or **$199/yr**
- Everything in Pro, plus:
- **10 images + video** per listing; option for **never-expire** listings
- **6 boosts/month** + **1 guaranteed Featured slot/month**
- **Free verification** + priority manual review
- **AI matching** + "available now" alerts + competitor/benchmark analytics + CSV export
- Animated/video hero + custom theme overrides
- **Unlimited** taps & trips; **priority placement** in city feeds
- Priority support + Founding/early-access status

---

## Layer 4 — Behavioral Pricing Tactics (mapped to the funnel)

1. **Loss aversion at the cap:** when a free user starts a 4th listing, let them *fully build the draft*, then gate publish: "Your listing is ready — publish it with Pro or a $4.99 one-off." The half-built draft is the hostage.
2. **Urgency on expiry:** day-12/14 reminders ("expires in 2 days — 1 tap to keep it live"). Recurring micro-yes decisions + re-engagement.
3. **Decoy/anchor:** à la carte ($4.99/listing, $0.37/day) is engineered so Pro wins by listing #2; Elite ($19.99) makes Pro ($9.99) feel safe/cheap.
4. **Charm + partitioned pricing:** $4.99 / $9.99 / $0.37-a-day (a day of visibility "for less than a coffee").
5. **Endowed progress (reuse existing Journey quests):** users who complete profile quests are invested → far likelier to pay to keep listings live. Surface "You're a Trusted Trader — don't let your listings expire."
6. **Referral credits become real money:** convert the cosmetic referral tiers into **listing credits** (e.g., 1 free 14-day listing per referral; Pro free for a month at 5 referrals). Lowers CAC, reciprocity, viral loop.
7. **Status goods:** Verified + Featured badges are Veblen goods — people pay for visible status. Keep them scarce ("limited featured slots per city this week").
8. **Free trial timed to pain:** 14-day Pro trial that ends exactly when their first listing would expire — they feel the loss of "unlimited" right at the decision point.
9. **Annual = commitment & consistency:** discount + cash upfront + lower churn; default the pricing toggle to "Annual (save 26%)".
10. **Default auto-renew (opt-out) with transparent reminders** for kept-live listings → recurring revenue without feeling predatory.
11. **Founding-member urgency:** early adopters lock lifetime pricing → converts now, not later.

---

## Layer 5 — Full Per-Feature Limitation Matrix

| Capability | Free | Pro $9.99 | Elite $19.99 |
|---|---|---|---|
| Live listings | 3 / 30 days | Unlimited | Unlimited + never-expire |
| Listing length | 14 days | 14 days, free renew | Never-expire option |
| Images / listing | 1 | 5 | 10 + video |
| Boosts | $1.99 each | 2/mo incl. | 6/mo incl. |
| Featured slots | $6.99 each | rotation-eligible | 1 guaranteed/mo |
| Analytics | counts only | full + viewers | + benchmark/export |
| Who-viewed-you | locked | full | full + history |
| Verification | $9.99 | $4.99 | free |
| Themes | 2 | all 5 + accent | all + video/custom |
| Saved folders | 3 | unlimited+share | + collaborative |
| Search | basic | full-text + saved | + AI matching/alerts |
| Taps/day | 10 | 50 | unlimited |
| Travel trips | 1 | 5 | unlimited + priority |
| Session requests/mo | 3 | unlimited | unlimited |
| Negotiate/message/review | Free | Free | Free |

---

## Layer 6 — Implementation Roadmap (when approved → code)

**Provider:** Stripe (Checkout for subs + one-offs, Billing for recurring, Customer Portal for self-serve, saved payment method for per-day listing charges). `resend` (already a dependency) for reminder emails; reuse the existing `/api/cron/*` pattern for the daily expiry/charge sweep.

**New DB (migrations):**
- `profiles.plan` (`free|pro|elite`) + `plan_renews_at`, `stripe_customer_id`
- `subscriptions` (stripe_subscription_id, status, tier, period_end)
- `listing_billing` (opportunity_id, paid_until, daily_extend bool, last_charged_at)
- `usage_counters` (user_id, period, listings_published, taps_sent, session_requests_sent…)
- `entitlements` helper (server util `getEntitlements(userId)` → limits object) — single source of truth for gating
- `payments` ledger (type, amount, stripe_payment_intent)

**Enforcement points (reuse existing flows):**
- Listing publish (`src/app/opportunities/**` create/publish action) → check `usage_counters` vs plan cap; block/redirect to paywall.
- Listing render/expiry → `listing_billing.paid_until`; cron expires or charges $0.37/day + sends day-12/14 reminders.
- Gating util applied in: image uploader (count), themes selector, `/views`, taps action, travel trip/session actions, search.
- `/api/stripe/webhook` → sync subscription status → `profiles.plan`.

**Phasing:** Phase 1 = subscriptions (Pro/Elite) + listing cap + paywall screen (fastest revenue, simplest). Phase 2 = à la carte listings + per-day extend + reminder cron. Phase 3 = boosts/featured/verification micro-txns + referral credits. Phase 4 = AI matching/analytics for Elite.

---

## Verification (per phase, Stripe test mode)
1. Free user hits 3-listing cap → 4th publish blocked → paywall → upgrade → publish succeeds.
2. À la carte: buy 1 listing → live 14 days → day-14 reminder → "keep live" charges $0.37/day → "let expire" stops cleanly.
3. Subscribe to Pro → caps lift instantly (entitlements reflect webhook) → cancel → revert at period end.
4. Boost/featured/verification one-offs apply the correct badge/placement.
5. Referral credit grants a free listing and decrements correctly.
6. Confirm core transacting (interest, negotiate, message, review) is never blocked at any tier.
