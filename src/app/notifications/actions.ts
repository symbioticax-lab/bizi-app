"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markAllNotificationsReadAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout"); // refresh header dot
}

/**
 * Marks one notification read and redirects to its target. Used by the
 * notification row click — server action keeps the read-state mutation
 * server-side, redirect handles navigation.
 */
export async function openNotificationAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const href = String(formData.get("href") ?? "/notifications");

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect(href);
}

export async function respondConnectionAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const connectionId = String(formData.get("connectionId") ?? "").trim();
  const response = formData.get("response") as "accepted" | "declined";

  if (!connectionId || !["accepted", "declined"].includes(response)) return;

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

  // Mark the connection_request notification read — match by connection ID so this
  // works whether called from the notification row (notifId provided) or the
  // Requests section (no notifId). The reference_id on the notification IS the connection ID.
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("reference_id", connectionId)
    .eq("type", "connection_request");

  if (response === "accepted") {
    // Use admin client — RLS has no INSERT policy for cross-user notification rows
    const admin = createAdminClient();
    await admin.from("notifications").insert({
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
