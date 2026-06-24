"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscores only"),
  display_name: z.string().min(1).max(60),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(80).optional().nullable(),
});

export type ProfileFormState = { error?: string; ok?: true } | undefined;

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = Schema.safeParse({
    username: String(formData.get("username") ?? "").trim().toLowerCase(),
    display_name: String(formData.get("display_name") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // skills now arrives as repeated form fields (one input per tag) from the
  // TagInput component, not as a single comma-separated string.
  const skills = formData.getAll("skills")
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
  // de-duplicate while preserving order
  const uniqueSkills = Array.from(new Set(skills));

  // Coordinates come from the hidden inputs the LocationAutocomplete renders.
  const parseCoord = (raw: FormDataEntryValue | null): number | null => {
    const n = Number(String(raw ?? "").trim());
    return Number.isFinite(n) && raw !== "" && raw !== null ? n : null;
  };
  const locationLat = parseCoord(formData.get("location_lat"));
  const locationLng = parseCoord(formData.get("location_lng"));

  const baseUpdate = {
    username: parsed.data.username,
    display_name: parsed.data.display_name,
    bio: parsed.data.bio,
    location: parsed.data.location,
    skills: uniqueSkills,
  };

  let { error } = await supabase
    .from("profiles")
    .update({ ...baseUpdate, location_lat: locationLat, location_lng: locationLng })
    .eq("id", user.id);

  // Gracefully degrade if the coordinate columns haven't been migrated yet.
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ error } = await supabase.from("profiles").update(baseUpdate).eq("id", user.id));
  }

  if (error) {
    if (error.code === "23505") return { error: "Username is already taken" };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/[username]", "page");
  // Land the user back on their profile so they can see the result of their edit.
  redirect(`/profile/${parsed.data.username}`);
}
