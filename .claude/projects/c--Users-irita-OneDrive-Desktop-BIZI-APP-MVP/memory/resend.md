---
name: BIZI Resend (transactional email)
description: Resend account is configured for the MVP — used for transactional emails on key state transitions
type: reference
---

- Provider: Resend (https://resend.com), free tier (100/day, 3000/month)
- Sender: `onboarding@resend.dev` — Resend's sandbox sender, no domain verification required. For production, verify a real domain and update `RESEND_FROM` in env.
- API key lives in `.env.local` as `RESEND_API_KEY` (provided 2026-05-07).
- Helper: `src/lib/email.ts` — `sendTransactionalEmail(userId, message)`. Looks up the recipient's email via Supabase admin client, sends via Resend, no-ops silently if `RESEND_API_KEY` missing, never throws.
- Templates: `src/lib/emails/templates.ts` — interestReceived, proposalReceived, counterReceived, tradeAccepted, tradeCompleted.
- Wired into: expressInterestAction, sendFirstProposalAction, submitCounterAction, acceptProposalAction, markTradeCompleteAction.
- Sandbox sender restriction: Resend's `onboarding@resend.dev` only sends to the *account owner's verified email address* during the test/free tier. To send to other addresses, verify a domain.
