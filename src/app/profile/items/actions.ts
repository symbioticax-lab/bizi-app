"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCategory } from "@/lib/categories";

// -----------------------------------------------------------------------------
// Offerings — what a user can provide (profile-level, distinct from listings)
// -----------------------------------------------------------------------------
const OfferingSchema = z.object({
  title:       z.string().min(2, "Give it a short title").max(80),
  description: z.string().min(10, "Add a few sentences").max(800),
  category:    z.string().refine(isCategory, "Pick a category"),
  tags:        z.string().optional(),
});

export type ProfileItemFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

function flattenErrors(parsed: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } } | { success: true }) {
  if (parsed.success) return undefined;
  const out: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function tagsFrom(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export async function upsertOfferingAction(
  offeringId: string | null,
  _prev: ProfileItemFormState,
  formData: FormData,
): Promise<ProfileItemFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = OfferingSchema.safeParse({
    title:       String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category:    String(formData.get("category") ?? ""),
    tags:        String(formData.get("tags") ?? ""),
  });
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenErrors(parsed) };
  const v = parsed.data;
  const tags = tagsFrom(v.tags);

  if (offeringId) {
    const { error } = await supabase
      .from("offerings")
      .update({ title: v.title, description: v.description, category: v.category, tags })
      .eq("id", offeringId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("offerings").insert({
      user_id: user.id,
      title: v.title,
      description: v.description,
      category: v.category,
      tags,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/profile/`);
  return { ok: true };
}

export async function deleteOfferingAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  await supabase.from("offerings").update({ status: "deleted" }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath(`/profile/`);
}

// -----------------------------------------------------------------------------
// Wants — what a user is looking for in exchange (profile-level)
// -----------------------------------------------------------------------------
const WantSchema = z.object({
  title:       z.string().min(2).max(80),
  description: z.string().max(500).optional().transform((v) => (v?.trim() ? v.trim() : null)),
  category:    z.string().optional().transform((v) => (v && isCategory(v) ? v : null)),
  tags:        z.string().optional(),
});

export async function upsertWantAction(
  wantId: string | null,
  _prev: ProfileItemFormState,
  formData: FormData,
): Promise<ProfileItemFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = WantSchema.safeParse({
    title:       String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    category:    String(formData.get("category") ?? ""),
    tags:        String(formData.get("tags") ?? ""),
  });
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenErrors(parsed) };
  const v = parsed.data;
  const tags = tagsFrom(v.tags);

  if (wantId) {
    const { error } = await supabase
      .from("wants")
      .update({ title: v.title, description: v.description, category: v.category, tags })
      .eq("id", wantId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("wants").insert({
      user_id: user.id,
      title: v.title,
      description: v.description,
      category: v.category,
      tags,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/profile/`);
  return { ok: true };
}

export async function deleteWantAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  await supabase.from("wants").update({ status: "deleted" }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath(`/profile/`);
}
