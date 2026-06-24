"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type FollowActionResult = { ok: true } | { error: string };

export async function followUserAction(formData: FormData): Promise<FollowActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const followeeId = String(formData.get("followeeId") ?? "").trim();
  if (!followeeId || followeeId === user.id) return { error: "Invalid user" };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followee_id: followeeId });

  if (error) {
    if (error.code === "23505") return { ok: true }; // already following — treat as success
    return { error: "Failed to follow" };
  }

  // Use admin client — RLS has no INSERT policy for cross-user notification rows
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: followeeId,
    type: "user_followed",
    reference_id: user.id,
    body: "",
    read: false,
    actor_id: user.id,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function unfollowUserAction(formData: FormData): Promise<FollowActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const followeeId = String(formData.get("followeeId") ?? "").trim();
  if (!followeeId) return { error: "Invalid user" };

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId);

  revalidatePath("/", "layout");
  return { ok: true };
}
