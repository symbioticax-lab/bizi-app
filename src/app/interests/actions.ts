"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const InterestSchema = z.object({
  message: z.string().min(20, "Tell the owner why you're a fit (20+ characters)").max(1000),
  offered_title: z.string().min(2, "What are you bringing?").max(80),
  offered_desc: z.string().min(10, "Add a few sentences (10+ characters)").max(800),
});

export type InterestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

export async function expressInterestAction(
  opportunityId: string,
  _prev: InterestFormState,
  formData: FormData,
): Promise<InterestFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/opportunities/${opportunityId}`);

  // Confirm the opportunity exists, is active, and isn't owned by the seeker.
  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, owner_id, status")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!opp) return { error: "Listing not found." };
  if (opp.owner_id === user.id) return { error: "You can't express interest in your own listing." };
  if (opp.status !== "active") return { error: "This listing isn't accepting interests right now." };

  const parsed = InterestSchema.safeParse({
    message: String(formData.get("message") ?? "").trim(),
    offered_title: String(formData.get("offered_title") ?? "").trim(),
    offered_desc: String(formData.get("offered_desc") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const { error } = await supabase.from("interests").insert({
    opportunity_id: opportunityId,
    seeker_id: user.id,
    message: v.message,
    offered_title: v.offered_title,
    offered_desc: v.offered_desc,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already expressed interest in this listing." };
    return { error: error.message };
  }

  // Cross-user notification + email. RLS blocks direct inserts on
  // notifications, so we use the admin client. Both are best-effort.
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: opp.owner_id,
      actor_id: user.id,
      type: "interest_received",
      reference_id: opportunityId,
      body: "expressed interest in your listing",
    });

    const [{ data: actor }, { data: opp2 }] = await Promise.all([
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      admin.from("opportunities").select("title").eq("id", opportunityId).maybeSingle(),
    ]);
    const { sendTransactionalEmail } = await import("@/lib/email");
    const { interestReceivedEmail } = await import("@/lib/emails/templates");
    await sendTransactionalEmail(
      opp.owner_id,
      interestReceivedEmail({
        actorName: actor?.display_name ?? "Someone",
        listingTitle: opp2?.title ?? "your listing",
        opportunityId,
      }),
    );
  } catch {
    // service role key may not be configured locally; non-fatal
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function declineInterestAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const interestId = String(formData.get("interest_id") ?? "");

  const { data: interest } = await supabase
    .from("interests")
    .select("id, opportunity_id, seeker_id, opportunities!inner(owner_id)")
    .eq("id", interestId)
    .maybeSingle();
  if (!interest) return;
  const ownerId = (interest.opportunities as unknown as { owner_id: string }).owner_id;
  if (ownerId !== user.id) return;

  await supabase.from("interests").update({ status: "declined" }).eq("id", interestId);

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: interest.seeker_id,
      actor_id: user.id,
      type: "interest_declined",
      reference_id: interest.opportunity_id,
      body: "wasn't a match this time",
    });
  } catch {}

  revalidatePath(`/opportunities/${interest.opportunity_id}`);
  revalidatePath("/dashboard");
}

export async function withdrawInterestAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const interestId = String(formData.get("interest_id") ?? "");

  const { data: interest } = await supabase
    .from("interests")
    .select("id, opportunity_id, seeker_id, opportunities!inner(owner_id)")
    .eq("id", interestId)
    .maybeSingle();
  if (!interest) return;
  if (interest.seeker_id !== user.id) return;

  await supabase.from("interests").update({ status: "withdrawn" }).eq("id", interestId);

  try {
    const ownerId = (interest.opportunities as unknown as { owner_id: string }).owner_id;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: ownerId,
      actor_id: user.id,
      type: "interest_withdrawn",
      reference_id: interest.opportunity_id,
      body: "withdrew their interest",
    });
  } catch {}

  revalidatePath(`/opportunities/${interest.opportunity_id}`);
  revalidatePath("/dashboard");
}

