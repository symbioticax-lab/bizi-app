"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCategory } from "@/lib/categories";

const tagsField = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8),
  );

// Strict validation — required for publishing.
const PublishSchema = z.object({
  title:           z.string().min(4, "Title must be at least 4 characters").max(120),
  description:    z.string().min(20, "Describe your listing in at least 20 characters").max(2000),
  category:       z.string().refine(isCategory, "Pick a category"),
  offering_title: z.string().min(2).max(80),
  offering_desc:  z.string().min(10).max(800),
  offering_tags:  tagsField,
  want_title:     z.string().min(2).max(80),
  want_desc:      z.string().min(10).max(800),
  want_tags:      tagsField,
  image_url:      z.string().url().optional().or(z.literal("")).transform((v) => v || null),
  negotiable:     z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

// Looser validation — drafts can have empty fields, only the title is required
// so the listing can be located in the drafts list.
const DraftSchema = z.object({
  title:           z.string().min(2, "Give your draft a short title").max(120),
  description:    z.string().max(2000),
  category:       z.string(),
  offering_title: z.string().max(80),
  offering_desc:  z.string().max(800),
  offering_tags:  tagsField,
  want_title:     z.string().max(80),
  want_desc:      z.string().max(800),
  want_tags:      tagsField,
  image_url:      z.string().url().optional().or(z.literal("")).transform((v) => v || null),
  negotiable:     z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export type OpportunityFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function rawFormData(formData: FormData) {
  return {
    title:          String(formData.get("title") ?? "").trim(),
    description:    String(formData.get("description") ?? "").trim(),
    category:       String(formData.get("category") ?? ""),
    offering_title: String(formData.get("offering_title") ?? "").trim(),
    offering_desc:  String(formData.get("offering_desc") ?? "").trim(),
    offering_tags:  String(formData.get("offering_tags") ?? ""),
    want_title:     String(formData.get("want_title") ?? "").trim(),
    want_desc:      String(formData.get("want_desc") ?? "").trim(),
    want_tags:      String(formData.get("want_tags") ?? ""),
    image_url:      String(formData.get("image_url") ?? ""),
    negotiable:     formData.get("negotiable"),
  };
}

function flattenFieldErrors(
  parsed: { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } } | { success: true },
): Record<string, string> | undefined {
  if (parsed.success) return undefined;
  const out: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Create a new listing. The button that submitted decides whether this is a
 * draft (intent="draft") or a published listing (intent="publish"). Drafts
 * use a relaxed schema so half-finished work can be saved.
 */
export async function createOpportunityAction(_prev: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/opportunities/new");

  const intent = String(formData.get("intent") ?? "publish");
  const isDraft = intent === "draft";

  const schema = isDraft ? DraftSchema : PublishSchema;
  const parsed = schema.safeParse(rawFormData(formData));
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenFieldErrors(parsed) };
  const v = parsed.data;

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      owner_id: user.id,
      title: v.title,
      description: v.description,
      category: v.category,
      offering_title: v.offering_title,
      offering_desc: v.offering_desc,
      offering_tags: v.offering_tags,
      want_title: v.want_title,
      want_desc: v.want_desc,
      want_tags: v.want_tags,
      image_urls: v.image_url ? [v.image_url] : [],
      negotiable: v.negotiable,
      status: isDraft ? "draft" : "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(isDraft ? "/dashboard" : `/opportunities/${data.id}`);
}

/**
 * Update an existing listing. intent="publish" promotes a draft to active.
 * intent="save" preserves the current status (or saves draft fields).
 */
export async function updateOpportunityAction(id: string, _prev: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const intent = String(formData.get("intent") ?? "save");
  const isPublishing = intent === "publish";

  // Fetch the current status so we know whether to use the relaxed schema.
  const { data: existing } = await supabase
    .from("opportunities")
    .select("status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const currentStatus = existing?.status ?? "active";
  const useDraftSchema = !isPublishing && currentStatus === "draft";

  const schema = useDraftSchema ? DraftSchema : PublishSchema;
  const parsed = schema.safeParse(rawFormData(formData));
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: flattenFieldErrors(parsed) };
  const v = parsed.data;

  // Lock editing once an active negotiation exists (per plan §8 edge case).
  const { count: activeNegs } = await supabase
    .from("negotiations")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", id)
    .in("status", ["proposal_sent", "counter_sent", "in_progress", "completed_by_owner", "completed_by_seeker"]);
  if ((activeNegs ?? 0) > 0) {
    return { error: "This listing has an active negotiation — editing is locked until it resolves." };
  }

  // Build the patch. If publishing, flip status → active.
  const patch: Record<string, unknown> = {
    title: v.title,
    description: v.description,
    category: v.category,
    offering_title: v.offering_title,
    offering_desc: v.offering_desc,
    offering_tags: v.offering_tags,
    want_title: v.want_title,
    want_desc: v.want_desc,
    want_tags: v.want_tags,
    image_urls: v.image_url ? [v.image_url] : [],
    negotiable: v.negotiable,
  };
  if (isPublishing) patch.status = "active";

  const { error } = await supabase
    .from("opportunities")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  // Saving a draft → stay on dashboard. Publishing or editing live → land on the listing.
  redirect(isPublishing || currentStatus !== "draft" ? `/opportunities/${id}` : "/dashboard");
}

/**
 * Toggle a listing's status. Used by the inline Switch on owner listing rows
 * (active ↔ paused) and by "Move to drafts" (status=draft).
 */
export async function setOpportunityStatusAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "paused", "draft"].includes(status)) return;

  await supabase.from("opportunities").update({ status }).eq("id", id).eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

/**
 * Soft delete — flips status to 'deleted'. The row stays in the DB so trade
 * history isn't broken. Used by the existing OwnerControls "Delete" button.
 */
export async function deleteOpportunityAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  await supabase.from("opportunities").update({ status: "deleted" }).eq("id", id).eq("owner_id", user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Hard delete — DELETE FROM. Used by the "Permanently delete" menu item on
 * owner listing rows. Cascades to interests + negotiations + trades + messages
 * via existing FK constraints (ON DELETE CASCADE), so use with confirmation
 * on the client.
 */
export async function hardDeleteOpportunityAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");

  await supabase.from("opportunities").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/", "layout");
}
