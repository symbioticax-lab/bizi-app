---
name: BIZI build cadence
description: How the user prefers iteration — small visible chunks, action over re-planning
type: feedback
---

User prefers small, visible iterations over thorough planning sessions on the BIZI build. When given multi-phase plans, they confirm a phase ("go", "lets do X", "lets go with choice 1") and expect immediate execution rather than further discussion.

**Why:** Repeated pattern across sprints — they declined a pre-flight build check, picked ngrok over Vercel for speed, and consistently use short directives ("go", "ok") to advance. They've also explicitly said "Do not generate the entire app at once" — so the preference is *small steps, fast*, not *one big push*.

**How to apply:**
- When they greenlight a phase, ship the smallest visible chunk first (one migration + one user-facing component is the right unit).
- Don't ask follow-up planning questions when they've already given a directive — execute.
- After shipping a chunk, briefly state what's done and what's next, then wait for their next directive.
- Resist the urge to bundle multiple chunks into one delivery, even when they're related — let them react between chunks.
