"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateThreadResult = { threadId: string } | { error: string };
export type DMMessageState = { ok: true } | { error: string } | undefined;

/**
 * Creates (or retrieves an existing) DM thread between the current user and
 * a recipient. Both users must have an accepted connection.
 *
 * UUIDs are sorted before insert so (A, B) and (B, A) always map to the same
 * row — this satisfies the UNIQUE(user1_id, user2_id) constraint and the
 * dm_users_ordered check (user1_id < user2_id).
 */
export async function createOrGetDMThreadAction(
  recipientId: string,
): Promise<CreateThreadResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (recipientId === user.id) return { error: "Cannot message yourself" };

  // Only accepted connections may start a DM thread
  const { data: conn } = await supabase
    .from("connections")
    .select("id")
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
      `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`,
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!conn) return { error: "You must be connected to start a direct message" };

  // Canonical order: lexicographically smaller UUID is user1_id
  const [u1, u2] = [user.id, recipientId].sort() as [string, string];

  const { data: existing } = await supabase
    .from("dm_threads")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle();

  if (existing) return { threadId: existing.id };

  const { data: thread, error } = await supabase
    .from("dm_threads")
    .insert({ user1_id: u1, user2_id: u2 })
    .select("id")
    .single();

  if (error || !thread) return { error: "Failed to create thread" };

  return { threadId: thread.id };
}

export async function sendDMAction(
  threadId: string,
  _prev: DMMessageState,
  formData: FormData,
): Promise<DMMessageState> {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Message cannot be empty" };
  if (content.length > 2000) return { error: "Message is too long (max 2000 characters)" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify the current user is a participant
  const { data: thread } = await supabase
    .from("dm_threads")
    .select("id")
    .eq("id", threadId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!thread) return { error: "Thread not found" };

  const now = new Date().toISOString();

  const { error: msgError } = await supabase
    .from("dm_messages")
    .insert({ thread_id: threadId, sender_id: user.id, content });

  if (msgError) return { error: "Failed to send message" };

  await supabase
    .from("dm_threads")
    .update({ last_msg_at: now })
    .eq("id", threadId);

  revalidatePath(`/messages/dm/${threadId}`);
  return { ok: true };
}
