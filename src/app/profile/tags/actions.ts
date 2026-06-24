"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TagActionState = { error?: string; ok?: true } | undefined;

const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 30;

function normalize(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Adds a single tag to the caller's profile.skills array. Idempotent —
 * inserting an already-present tag is a no-op success.
 */
export async function addTagAction(rawTag: string): Promise<TagActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tag = normalize(rawTag);
  if (!tag) return { error: "Tag can't be empty." };
  if (tag.length > MAX_TAG_LENGTH) return { error: `Tag must be ${MAX_TAG_LENGTH} characters or fewer.` };

  const { data: profile } = await supabase
    .from("profiles")
    .select("skills, username")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { error: "Profile not found." };

  const skills: string[] = profile.skills ?? [];
  if (skills.includes(tag)) return { ok: true };
  if (skills.length >= MAX_TAGS) return { error: `Cap reached — ${MAX_TAGS} tags max.` };

  const { error } = await supabase
    .from("profiles")
    .update({ skills: [...skills, tag] })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile/[username]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  return { ok: true };
}

/**
 * Removes a single tag from the caller's profile.skills array. No-op if the
 * tag wasn't present.
 */
export async function removeTagAction(rawTag: string): Promise<TagActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tag = normalize(rawTag);
  if (!tag) return { ok: true };

  const { data: profile } = await supabase
    .from("profiles")
    .select("skills")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return { ok: true };

  const skills: string[] = profile.skills ?? [];
  if (!skills.includes(tag)) return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update({ skills: skills.filter((s) => s !== tag) })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile/[username]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  return { ok: true };
}
