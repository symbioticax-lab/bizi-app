"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type LocationPref = "local" | "remote" | "both";

const LOCATIONS = new Set<LocationPref>(["local", "remote", "both"]);

async function requireUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signup");
  return { supabase, userId: user.id };
}

function nextStepUrl(step: number) {
  return `/onboarding?step=${step}`;
}

function parseCoord(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  return Number.isFinite(n) && raw !== "" && raw !== null ? n : null;
}

export async function saveIdentityAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const bio = String(formData.get("bio") ?? "").trim().slice(0, 500) || null;
  const location = String(formData.get("location") ?? "").trim().slice(0, 80) || null;
  const location_lat = parseCoord(formData.get("location_lat"));
  const location_lng = parseCoord(formData.get("location_lng"));

  const baseUpdate = { bio, location };
  let { error } = await supabase
    .from("profiles")
    .update({ ...baseUpdate, location_lat, location_lng })
    .eq("id", userId);

  // Gracefully degrade if coordinate columns haven't been migrated yet.
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    await supabase.from("profiles").update(baseUpdate).eq("id", userId);
  }

  redirect(nextStepUrl(2));
}

export async function saveSkillsOfferedAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const skills = sanitizeTags(formData.getAll("skills"));
  await supabase.from("profiles").update({ skills }).eq("id", userId);
  redirect(nextStepUrl(3));
}

export async function saveSkillsWantedAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const skills_wanted = sanitizeTags(formData.getAll("skills_wanted"));
  await supabase.from("profiles").update({ skills_wanted }).eq("id", userId);
  redirect(nextStepUrl(4));
}

export async function saveLocationPrefAndCompleteAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const raw = String(formData.get("trade_location_pref") ?? "");
  const trade_location_pref = (LOCATIONS.has(raw as LocationPref) ? raw : "both") as LocationPref;
  await supabase
    .from("profiles")
    .update({ trade_location_pref, onboarding_completed: true })
    .eq("id", userId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

function sanitizeTags(raw: FormDataEntryValue[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    const s = String(v).trim().toLowerCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 12) break;
  }
  return out;
}
