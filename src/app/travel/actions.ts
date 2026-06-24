"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription/server";
import { isAtTripLimit } from "@/lib/subscription/tiers";
import { CITY_SLUGS, TRIP_OPPORTUNITY_TYPE_VALUES } from "@/lib/travel/cities";

const TripSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Max 50 characters"),
  destination: z.enum(CITY_SLUGS),
  begin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  available_for_hire: z.boolean().default(false),
  purpose: z.enum(["travel", "work", "shoot", "event", "leisure"]),
  opportunity_type: z.enum(TRIP_OPPORTUNITY_TYPE_VALUES).optional(),
  description: z.string().max(500).optional(),
  cover_image_url: z.string().url().optional(),
}).refine(
  (v) => v.end_date >= v.begin_date,
  { message: "End date must be on or after begin date", path: ["end_date"] },
);

export type TripFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

export async function createTripAction(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/travel/travelogue");

  const coverRaw = String(formData.get("cover_image_url") ?? "").trim();
  const oppTypeRaw = String(formData.get("opportunity_type") ?? "").trim();
  const parsed = TripSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    destination: String(formData.get("destination") ?? ""),
    begin_date: String(formData.get("begin_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    available_for_hire: formData.get("available_for_hire") === "on",
    purpose: String(formData.get("purpose") ?? ""),
    opportunity_type: oppTypeRaw || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    cover_image_url: coverRaw || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  // Enforce active trip limit for free users
  const tier = await getUserTier();
  const { count: activeTrips } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("end_date", new Date().toISOString().slice(0, 10));

  if (isAtTripLimit(tier, activeTrips ?? 0)) {
    return {
      error: "Free accounts can have 1 active trip at a time. Upgrade to Bizi Plus for unlimited trips.",
    };
  }

  // Strip undefined values so optional columns that don't yet exist in the
  // schema cache are never referenced in the INSERT statement.
  const insertData = Object.fromEntries(
    Object.entries({ user_id: user.id, ...parsed.data }).filter(([, v]) => v !== undefined),
  );
  const { error } = await supabase.from("trips").insert(insertData);
  if (error) return { error: error.message };

  revalidatePath("/travel/travelogue");
  revalidatePath(`/travel/${parsed.data.destination}`);
  return { ok: true };
}

// ── Session request actions ────────────────────────────────────────────────────

export type SessionFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: true;
} | undefined;

export async function requestSessionAction(
  tripId: string,
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const proposed_date = String(formData.get("proposed_date") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!proposed_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { error: "Please pick a date.", fieldErrors: { proposed_date: "Required" } };
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("user_id, begin_date, end_date, title, destination")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) return { error: "Trip not found." };
  if (trip.user_id === user.id) return { error: "This is your own trip." };
  if (proposed_date < trip.begin_date || proposed_date > trip.end_date) {
    return { error: "Date must be within the trip window.", fieldErrors: { proposed_date: "Outside trip dates" } };
  }

  const { error } = await supabase.from("trip_session_requests").insert({
    trip_id: tripId,
    requester_id: user.id,
    traveler_id: trip.user_id,
    type: "session",
    proposed_date,
    message,
  });
  if (error) return { error: error.message };

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: actor } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const fmtDate = new Date(proposed_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    await admin.from("notifications").insert({
      user_id: trip.user_id,
      actor_id: user.id,
      type: "session_request",
      reference_id: tripId,
      body: `${actor?.display_name ?? "Someone"} wants to meet on ${fmtDate}`,
    });
  } catch { /* non-fatal */ }

  revalidatePath(`/travel/${trip.destination}/${tripId}`);
  return { ok: true };
}

export async function connectTripAction(
  tripId: string,
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const message = String(formData.get("message") ?? "").trim() || null;

  const { data: trip } = await supabase
    .from("trips")
    .select("user_id, destination, title")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) return { error: "Trip not found." };
  if (trip.user_id === user.id) return { error: "This is your own trip." };

  const { error } = await supabase.from("trip_session_requests").insert({
    trip_id: tripId,
    requester_id: user.id,
    traveler_id: trip.user_id,
    type: "connect",
    message,
  });
  if (error) return { error: error.message };

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: actor } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    await admin.from("notifications").insert({
      user_id: trip.user_id,
      actor_id: user.id,
      type: "session_request",
      reference_id: tripId,
      body: `${actor?.display_name ?? "Someone"} wants to connect about your trip`,
    });
  } catch { /* non-fatal */ }

  return { ok: true };
}

export async function acceptSessionRequestAction(requestId: string, _formData?: FormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: req } = await supabase
    .from("trip_session_requests")
    .select("traveler_id, requester_id, trip_id, proposed_date, trips(destination)")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.traveler_id !== user.id) return;

  await supabase.from("trip_session_requests").update({ status: "accepted" }).eq("id", requestId);

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: actor } = await admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    const fmtDate = req.proposed_date
      ? new Date(req.proposed_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
    await admin.from("notifications").insert({
      user_id: req.requester_id,
      actor_id: user.id,
      type: "session_accepted",
      reference_id: req.trip_id,
      body: fmtDate
        ? `${actor?.display_name ?? "They"} accepted your session request for ${fmtDate}`
        : `${actor?.display_name ?? "They"} accepted your connection request`,
    });
  } catch { /* non-fatal */ }

  const dest = (req.trips as unknown as { destination: string } | null)?.destination;
  if (dest) revalidatePath(`/travel/${dest}/${req.trip_id}`);
  revalidatePath("/travel/travelogue");
}

export async function declineSessionRequestAction(requestId: string, _formData?: FormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: req } = await supabase
    .from("trip_session_requests")
    .select("traveler_id, requester_id, trip_id, trips(destination)")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.traveler_id !== user.id) return;

  await supabase.from("trip_session_requests").update({ status: "declined" }).eq("id", requestId);

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: req.requester_id,
      actor_id: user.id,
      type: "session_declined",
      reference_id: req.trip_id,
      body: "Your session request wasn't a match this time",
    });
  } catch { /* non-fatal */ }

  revalidatePath("/travel/travelogue");
}

export async function deleteTripAction(tripId: string, _formData?: FormData): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trip } = await supabase
    .from("trips")
    .select("user_id, destination")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip || trip.user_id !== user.id) return;

  await supabase.from("trips").delete().eq("id", tripId);

  revalidatePath("/travel/travelogue");
  revalidatePath(`/travel/${trip.destination}`);
}
