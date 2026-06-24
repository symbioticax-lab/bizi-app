"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier, getMonthlyUsage, incrementUsage } from "@/lib/subscription/server";
import { isAtConnectionLimit } from "@/lib/subscription/tiers";

export type ConnectionActionResult = { ok: true } | { error: string; upgrade?: boolean };

export async function sendConnectionRequestAction(
  formData: FormData,
): Promise<ConnectionActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const recipientId = String(formData.get("recipientId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 180) || null;

  if (!recipientId || recipientId === user.id) return { error: "Invalid recipient" };

  // Enforce monthly connection request limit for free users
  const tier = await getUserTier();
  const { connection_requests } = await getMonthlyUsage(user.id);
  if (isAtConnectionLimit(tier, connection_requests)) {
    return {
      error: "You've used all 5 free connection requests this month. Upgrade for unlimited.",
      upgrade: true,
    };
  }

  // Check for an existing connection in either direction
  const { data: existing } = await supabase
    .from("connections")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
      `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return { error: "Already connected" };
    if (existing.status === "pending") return { error: "Request already sent" };
    // Declined — allow re-send
    await supabase.from("connections").delete().eq("id", existing.id);
  }

  const { data: conn, error: connError } = await supabase
    .from("connections")
    .insert({ requester_id: user.id, recipient_id: recipientId, note })
    .select("id")
    .single();

  if (connError || !conn) return { error: "Failed to send request" };

  // Increment monthly usage counter after successful insert
  await incrementUsage(user.id, "connection_requests");

  // Use admin client — RLS has no INSERT policy for cross-user notification rows
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: recipientId,
    type: "connection_request",
    reference_id: conn.id,
    body: note ?? "",
    read: false,
    actor_id: user.id,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function respondToConnectionAction(formData: FormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const response = formData.get("response") as "accepted" | "declined";
  const notifId = String(formData.get("notifId") ?? "").trim();

  if (!connectionId || !["accepted", "declined"].includes(response)) return;

  // Verify the current user is the recipient and the connection is still pending
  const { data: conn } = await supabase
    .from("connections")
    .select("id, requester_id, status")
    .eq("id", connectionId)
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!conn) return;

  await supabase
    .from("connections")
    .update({ status: response, updated_at: new Date().toISOString() })
    .eq("id", connectionId);

  if (notifId) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId)
      .eq("user_id", user.id);
  }

  if (response === "accepted") {
    await supabase.from("notifications").insert({
      user_id: conn.requester_id,
      type: "connection_accepted",
      reference_id: connectionId,
      body: "",
      read: false,
      actor_id: user.id,
    });
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
