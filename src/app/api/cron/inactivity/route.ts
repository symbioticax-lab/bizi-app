import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Inactivity sweep — run daily.
 *
 *   day 7  → reminder notifications to both parties
 *   day 14 → second reminder
 *   day 21 → auto-expire (status = 'expired_inactive')
 *
 * To avoid double-sending reminders without adding columns to the
 * negotiations table, we look at the notifications table for an existing
 * `inactivity_reminder_7d` / `_14d` notification keyed to the same
 * (user_id, reference_id) pair. If one exists, we skip.
 *
 * Auth: matched against `Authorization: Bearer <CRON_SECRET>`. Vercel Cron
 * sends this header automatically when configured in vercel.json.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const provided = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (provided !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: stale } = await admin
    .from("negotiations")
    .select("id, owner_id, seeker_id, last_action_at")
    .in("status", ["proposal_sent", "counter_sent"])
    .lt("last_action_at", new Date(now.getTime() - 7 * 86400_000).toISOString());

  type NegRow = { id: string; owner_id: string; seeker_id: string; last_action_at: string };
  const negotiations = (stale ?? []) as NegRow[];

  const summary = { reminded7: 0, reminded14: 0, expired: 0, scanned: negotiations.length };

  for (const neg of negotiations) {
    const ageMs = now.getTime() - new Date(neg.last_action_at).getTime();
    const ageDays = ageMs / 86400_000;

    if (ageDays >= 21) {
      await admin.from("negotiations").update({ status: "expired_inactive" }).eq("id", neg.id);
      await admin.from("messages").insert({
        negotiation_id: neg.id,
        sender_id: neg.owner_id, // attributed to owner so RLS allows reading; system message
        content: "expired due to inactivity",
        type: "system",
      });
      await admin.from("notifications").insert([
        { user_id: neg.owner_id,  type: "inactivity_expired", reference_id: neg.id, body: "expired due to inactivity" },
        { user_id: neg.seeker_id, type: "inactivity_expired", reference_id: neg.id, body: "expired due to inactivity" },
      ]);
      summary.expired++;
      continue;
    }

    if (ageDays >= 14) {
      const sent = await alreadyNotified(admin, neg.id, "inactivity_reminder_14d");
      if (!sent) {
        await admin.from("notifications").insert([
          { user_id: neg.owner_id,  type: "inactivity_reminder_14d", reference_id: neg.id, body: "is waiting on you (14 days)" },
          { user_id: neg.seeker_id, type: "inactivity_reminder_14d", reference_id: neg.id, body: "is waiting on you (14 days)" },
        ]);
        summary.reminded14++;
      }
      continue;
    }

    if (ageDays >= 7) {
      const sent = await alreadyNotified(admin, neg.id, "inactivity_reminder_7d");
      if (!sent) {
        await admin.from("notifications").insert([
          { user_id: neg.owner_id,  type: "inactivity_reminder_7d", reference_id: neg.id, body: "is waiting on you" },
          { user_id: neg.seeker_id, type: "inactivity_reminder_7d", reference_id: neg.id, body: "is waiting on you" },
        ]);
        summary.reminded7++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary, ranAt: now.toISOString() });
}

async function alreadyNotified(
  admin: ReturnType<typeof createAdminClient>,
  negotiationId: string,
  type: string,
): Promise<boolean> {
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("type", type)
    .eq("reference_id", negotiationId);
  return (count ?? 0) > 0;
}
