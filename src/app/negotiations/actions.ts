"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email";
import {
  proposalReceivedEmail,
  counterReceivedEmail,
  tradeAcceptedEmail,
} from "@/lib/emails/templates";

/**
 * Look up actor's display name + the opportunity title for a given negotiation.
 * Used to fill email templates after a state-changing RPC.
 */
async function emailContextForNegotiation(negotiationId: string, actorId: string) {
  try {
    const admin = createAdminClient();
    const [{ data: actor }, { data: neg }] = await Promise.all([
      admin.from("profiles").select("display_name").eq("id", actorId).maybeSingle(),
      admin.from("negotiations").select("opportunity:opportunities!inner(title)").eq("id", negotiationId).maybeSingle(),
    ]);
    const title = (neg?.opportunity as unknown as { title: string } | null)?.title;
    return {
      actorName: actor?.display_name ?? "Someone",
      listingTitle: title ?? "your trade",
    };
  } catch {
    return { actorName: "Someone", listingTitle: "your trade" };
  }
}

const ProposalSchema = z.object({
  owner_gives:   z.string().min(10, "Describe what you'll provide (10+ chars)").max(2000),
  seeker_gives:  z.string().min(10, "Describe what they'll provide (10+ chars)").max(2000),
  timeline_days: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().positive().max(365).nullable(),
  ),
  notes:         z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().max(1000).nullable()),
});

export type NegotiationFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

function flattenErrors(parsed: ReturnType<typeof ProposalSchema.safeParse>): Record<string, string> | undefined {
  if (parsed.success) return undefined;
  const out: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function parseProposal(formData: FormData) {
  return ProposalSchema.safeParse({
    owner_gives:   String(formData.get("owner_gives") ?? "").trim(),
    seeker_gives:  String(formData.get("seeker_gives") ?? "").trim(),
    timeline_days: String(formData.get("timeline_days") ?? ""),
    notes:         String(formData.get("notes") ?? "").trim(),
  });
}

// -----------------------------------------------------------------------------
// Send the FIRST proposal (owner only). Wraps send_first_proposal RPC.
// -----------------------------------------------------------------------------
export async function sendFirstProposalAction(
  interestId: string,
  _prev: NegotiationFormState,
  formData: FormData,
): Promise<NegotiationFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/interests/${interestId}/propose`);

  const parsed = parseProposal(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenErrors(parsed) };
  const v = parsed.data;

  const { data, error } = await supabase
    .rpc("send_first_proposal", {
      p_interest_id:   interestId,
      p_owner_gives:   v.owner_gives,
      p_seeker_gives:  v.seeker_gives,
      p_timeline_days: v.timeline_days,
      p_notes:         v.notes,
    })
    .single();

  if (error) return { error: error.message };

  const result = data as unknown as { negotiation_id: string };

  // Email the seeker that they have a proposal waiting.
  try {
    const admin = createAdminClient();
    const { data: neg } = await admin
      .from("negotiations")
      .select("seeker_id, opportunity:opportunities!inner(title)")
      .eq("id", result.negotiation_id)
      .maybeSingle();
    if (neg) {
      const seekerId = neg.seeker_id as string;
      const title = (neg.opportunity as unknown as { title: string }).title;
      const { data: actor } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      await sendTransactionalEmail(seekerId, proposalReceivedEmail({
        actorName: actor?.display_name ?? "The owner",
        listingTitle: title,
        negotiationId: result.negotiation_id,
      }));
    }
  } catch {}

  revalidatePath("/dashboard");
  revalidatePath("/negotiations");
  redirect(`/negotiations/${result.negotiation_id}`);
}

// -----------------------------------------------------------------------------
// Submit a counter-offer (either party — server enforces "not your own turn").
// -----------------------------------------------------------------------------
export async function submitCounterAction(
  negotiationId: string,
  expectedVersion: number,
  _prev: NegotiationFormState,
  formData: FormData,
): Promise<NegotiationFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/negotiations/${negotiationId}`);

  const parsed = parseProposal(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenErrors(parsed) };
  const v = parsed.data;

  // Determine the caller's role so we can enforce that each party only edits
  // their own side. Fetch both the negotiation and the current proposal.
  const [{ data: neg }, { data: currentProposal }] = await Promise.all([
    supabase
      .from("negotiations")
      .select("owner_id, seeker_id")
      .eq("id", negotiationId)
      .maybeSingle(),
    supabase
      .from("proposals")
      .select("owner_gives, seeker_gives")
      .eq("negotiation_id", negotiationId)
      .eq("version", expectedVersion)
      .maybeSingle(),
  ]);

  if (!neg) return { error: "Negotiation not found." };
  if (!currentProposal) return { error: "Current proposal not found." };

  const isOwner = neg.owner_id === user.id;
  if (neg.owner_id !== user.id && neg.seeker_id !== user.id) {
    return { error: "You are not a participant in this negotiation." };
  }

  // Force the opposing party's field to the stored value regardless of what
  // the client submitted — makes it impossible to overwrite the other side.
  const owner_gives  = isOwner ? v.owner_gives          : currentProposal.owner_gives;
  const seeker_gives = isOwner ? currentProposal.seeker_gives : v.seeker_gives;

  const { error } = await supabase.rpc("submit_counter_proposal", {
    p_negotiation_id:   negotiationId,
    p_expected_version: expectedVersion,
    p_owner_gives:      owner_gives,
    p_seeker_gives:     seeker_gives,
    p_timeline_days:    v.timeline_days,
    p_notes:            v.notes,
  });

  if (error) return { error: error.message };

  // Email the counterpart about the counter-offer.
  try {
    const admin = createAdminClient();
    const { data: neg } = await admin
      .from("negotiations")
      .select("owner_id, seeker_id, opportunity:opportunities!inner(title)")
      .eq("id", negotiationId)
      .maybeSingle();
    if (neg) {
      const otherId = neg.owner_id === user.id ? neg.seeker_id as string : neg.owner_id as string;
      const ctx = await emailContextForNegotiation(negotiationId, user.id);
      await sendTransactionalEmail(otherId, counterReceivedEmail({
        actorName: ctx.actorName,
        listingTitle: ctx.listingTitle,
        negotiationId,
      }));
    }
  } catch {}

  revalidatePath(`/negotiations/${negotiationId}`);
  revalidatePath("/negotiations");
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Accept the current proposal — creates a trade and transitions to in_progress.
// -----------------------------------------------------------------------------
export async function acceptProposalAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const negotiationId = String(formData.get("negotiation_id") ?? "");
  const proposalId = String(formData.get("proposal_id") ?? "");

  const { data, error } = await supabase
    .rpc("accept_proposal", { p_negotiation_id: negotiationId, p_proposal_id: proposalId })
    .single();

  if (error) {
    redirect(`/negotiations/${negotiationId}?error=${encodeURIComponent(error.message)}`);
  }

  const result = data as unknown as { trade_id: string };

  // Email the counterpart that the deal is on.
  try {
    const admin = createAdminClient();
    const { data: neg } = await admin
      .from("negotiations")
      .select("owner_id, seeker_id, opportunity:opportunities!inner(title)")
      .eq("id", negotiationId)
      .maybeSingle();
    if (neg) {
      const otherId = neg.owner_id === user.id ? neg.seeker_id as string : neg.owner_id as string;
      const ctx = await emailContextForNegotiation(negotiationId, user.id);
      await sendTransactionalEmail(otherId, tradeAcceptedEmail({
        actorName: ctx.actorName,
        listingTitle: ctx.listingTitle,
        tradeId: result.trade_id,
      }));
    }
  } catch {}

  revalidatePath(`/negotiations/${negotiationId}`);
  revalidatePath("/negotiations");
  revalidatePath("/dashboard");
  redirect(`/trades/${result.trade_id}`);
}

// -----------------------------------------------------------------------------
// Cancel / decline a negotiation. Either party can cancel from
// proposal_sent or counter_sent. Direct UPDATE (no RPC).
// -----------------------------------------------------------------------------
export async function cancelNegotiationAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("negotiation_id") ?? "");

  const { data: neg } = await supabase
    .from("negotiations")
    .select("id, owner_id, seeker_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!neg) return;
  if (neg.owner_id !== user.id && neg.seeker_id !== user.id) return;
  if (!["proposal_sent", "counter_sent"].includes(neg.status)) return;

  const { error } = await supabase
    .from("negotiations")
    .update({ status: "cancelled", last_action_by: user.id, last_action_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;

  // Insert a system message recording the cancellation.
  await supabase.from("messages").insert({
    negotiation_id: id,
    sender_id: user.id,
    content: "cancelled the negotiation",
    type: "system",
  });

  // Notify the counterpart.
  const otherId = neg.owner_id === user.id ? neg.seeker_id : neg.owner_id;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: otherId,
      actor_id: user.id,
      type: "counter_sent", // reuses negotiation icon/route; body distinguishes it
      reference_id: id,
      body: "cancelled the negotiation",
    });
  } catch {}

  revalidatePath(`/negotiations/${id}`);
  revalidatePath("/negotiations");
}

// -----------------------------------------------------------------------------
// Send a chat message in a negotiation thread.
// -----------------------------------------------------------------------------
const MessageSchema = z.object({
  content: z.string().min(1, "Type something").max(2000),
});

export type MessageFormState = { error?: string; ok?: true } | undefined;

export async function sendMessageAction(
  negotiationId: string,
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = MessageSchema.safeParse({ content: String(formData.get("content") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase.from("messages").insert({
    negotiation_id: negotiationId,
    sender_id: user.id,
    content: parsed.data.content,
    type: "text",
  });
  if (error) return { error: error.message };

  revalidatePath(`/negotiations/${negotiationId}`);
  return { ok: true };
}
