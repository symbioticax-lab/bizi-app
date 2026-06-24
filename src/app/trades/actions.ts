"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email";
import { tradeCompletedEmail } from "@/lib/emails/templates";
import { REVIEW_TAGS, MAX_TAGS } from "@/lib/review-tags";

// -----------------------------------------------------------------------------
// Mark a trade complete on the caller's side. Wraps the mark_trade_complete RPC.
// -----------------------------------------------------------------------------
export async function markTradeCompleteAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("trade_id") ?? "");
  const { error } = await supabase.rpc("mark_trade_complete", { p_trade_id: id });

  if (error) {
    // Idempotent: a re-submit on an already-completed side or trade is the
    // user's intent satisfied — don't surface it as an error.
    const benign = /already marked complete|not completable.*status=completed/i.test(error.message);
    if (!benign) {
      redirect(`/trades/${id}?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    // Email the counterpart about the completion event.
    try {
      const admin = createAdminClient();
      const { data: trade } = await admin
        .from("trades")
        .select("owner_id, seeker_id, negotiation:negotiations!inner(opportunity:opportunities!inner(title))")
        .eq("id", id)
        .maybeSingle();
      if (trade) {
        const otherId = trade.owner_id === user.id ? trade.seeker_id as string : trade.owner_id as string;
        const title = ((trade.negotiation as unknown) as { opportunity: { title: string } }).opportunity.title;
        const { data: actor } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        await sendTransactionalEmail(otherId, tradeCompletedEmail({
          actorName: actor?.display_name ?? "Your counterpart",
          listingTitle: title,
          tradeId: id,
        }));
      }
    } catch {}
  }

  revalidatePath(`/trades/${id}`);
  revalidatePath("/trades");
  revalidatePath("/dashboard");
}

// -----------------------------------------------------------------------------
// Open a dispute on a trade. MVP: flips status, stores reason.
// (Email-to-admin flow lands in Sprint 5/7.)
// -----------------------------------------------------------------------------
const DisputeSchema = z.object({
  reason: z.string().min(100, "Disputes need at least 100 characters of context").max(2000),
});

export type DisputeFormState = { error?: string; ok?: true } | undefined;

export async function openDisputeAction(
  tradeId: string,
  _prev: DisputeFormState,
  formData: FormData,
): Promise<DisputeFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = DisputeSchema.safeParse({ reason: String(formData.get("reason") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data: trade } = await supabase
    .from("trades")
    .select("id, owner_id, seeker_id, status, negotiation_id")
    .eq("id", tradeId)
    .maybeSingle();
  if (!trade) return { error: "Trade not found." };
  if (trade.owner_id !== user.id && trade.seeker_id !== user.id) return { error: "Not a participant." };
  if (!["in_progress", "completed_by_owner", "completed_by_seeker"].includes(trade.status)) {
    return { error: "This trade can't be disputed in its current state." };
  }

  const { error } = await supabase
    .from("trades")
    .update({ status: "disputed", dispute_reason: parsed.data.reason, disputed_by: user.id })
    .eq("id", tradeId);
  if (error) return { error: error.message };

  // Notify the counterpart. (Admin email is a future Sprint 5/7 task.)
  const otherId = trade.owner_id === user.id ? trade.seeker_id : trade.owner_id;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: otherId,
      actor_id: user.id,
      type: "trade_completed",
      reference_id: tradeId,
      body: "opened a dispute on the trade",
    });
  } catch {}

  revalidatePath(`/trades/${tradeId}`);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Submit a review for a completed trade. The DB recompute_rating trigger
// updates the reviewee's rating_avg/review_count automatically.
// -----------------------------------------------------------------------------
const ReviewSchema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().transform((v) => (v?.trim() ? v.trim() : null)),
});

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

export async function submitReviewAction(
  tradeId: string,
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ratingRaw = formData.get("rating");
  const parsed = ReviewSchema.safeParse({
    rating: ratingRaw ? Number(ratingRaw) : NaN,
    comment: String(formData.get("comment") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Pick a star rating between 1 and 5." };
  }

  // Tags: deduplicate, validate against the taxonomy, cap.
  const allowedIds = new Set(REVIEW_TAGS.map((t) => t.id));
  const submittedTags = formData.getAll("tags").map(String).filter((t) => allowedIds.has(t as never));
  const tags = Array.from(new Set(submittedTags)).slice(0, MAX_TAGS);

  // Validate the trade and figure out who the reviewee is.
  const { data: trade } = await supabase
    .from("trades")
    .select("id, owner_id, seeker_id, status")
    .eq("id", tradeId)
    .maybeSingle();
  if (!trade) return { error: "Trade not found." };
  if (trade.owner_id !== user.id && trade.seeker_id !== user.id) return { error: "Not a participant." };
  if (trade.status !== "completed") return { error: "You can only review completed trades." };

  const reviewee_id = trade.owner_id === user.id ? trade.seeker_id : trade.owner_id;

  const { error } = await supabase.from("reviews").insert({
    trade_id: tradeId,
    reviewer_id: user.id,
    reviewee_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    tags,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already reviewed this trade." };
    return { error: error.message };
  }

  // Notify the reviewee.
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: reviewee_id,
      actor_id: user.id,
      type: "review_received",
      reference_id: tradeId,
      body: "left you a review",
    });
  } catch {}

  revalidatePath(`/trades/${tradeId}`);
  revalidatePath("/profile/[username]", "page"); // revalidates all /profile/* dynamic routes
  revalidatePath("/"); // discovery feed shows updated rating_avg
  revalidatePath("/dashboard");
  return { ok: true };
}
