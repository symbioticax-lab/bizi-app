"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AvatarActionState = { error?: string; ok?: true } | undefined;

/**
 * Persists a freshly-uploaded avatar URL on the profile row, then best-effort
 * deletes the previously-stored avatar from the storage bucket so we don't
 * accumulate orphaned objects.
 */
export async function setAvatarAction(url: string): Promise<AvatarActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Capture the existing URL so we can clean up after a successful update.
  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (existing?.avatar_url && existing.avatar_url !== url) {
    const part = existing.avatar_url.split(`/avatars/`)[1];
    if (part) {
      try { await supabase.storage.from("avatars").remove([part]); } catch {}
    }
  }

  revalidatePath("/profile/edit");
  revalidatePath("/dashboard");
  revalidatePath("/profile/[username]", "page");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<AvatarActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (existing?.avatar_url) {
    const part = existing.avatar_url.split(`/avatars/`)[1];
    if (part) {
      try { await supabase.storage.from("avatars").remove([part]); } catch {}
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/[username]", "page");
  return { ok: true };
}
