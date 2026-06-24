"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const HeroSetSchema = z.object({
  url:          z.string().url(),
  kind:         z.enum(["image", "gif", "video"]),
  poster_url:   z.string().url().optional().nullable(),
  focal_x:      z.number().min(0).max(1).default(0.5),
  focal_y:      z.number().min(0).max(1).default(0.5),
});

export type HeroActionState = { error?: string; ok?: true } | undefined;

/**
 * Persists a freshly-uploaded hero (image/GIF/video) on the profile row.
 * The browser uploads to Supabase Storage directly, then calls this with the
 * resulting public URL and metadata.
 */
export async function setHeroAction(input: z.infer<typeof HeroSetSchema>): Promise<HeroActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = HeroSetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid hero data" };
  const v = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      hero_url: v.url,
      hero_kind: v.kind,
      hero_poster_url: v.poster_url ?? null,
      hero_focal_x: v.focal_x,
      hero_focal_y: v.focal_y,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile/edit");
  revalidatePath("/dashboard");
  // Public profile cache lives at a username-keyed path; we don't have it here,
  // so use a wildcard — Next 14 will revalidate any matching cached page.
  revalidatePath("/profile/[username]", "page");
  return { ok: true };
}

/**
 * Updates only the focal point (no media re-upload). Used by the drag-to-position
 * editor on the profile page.
 */
export async function setHeroFocalAction(focal_x: number, focal_y: number): Promise<HeroActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const x = Math.max(0, Math.min(1, focal_x));
  const y = Math.max(0, Math.min(1, focal_y));

  const { error } = await supabase
    .from("profiles")
    .update({ hero_focal_x: x, hero_focal_y: y })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile/edit");
  revalidatePath("/profile/[username]", "page");
  return { ok: true };
}

/**
 * Removes the hero from the profile and best-effort deletes the storage object.
 */
export async function removeHeroAction(): Promise<HeroActionState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("hero_url, hero_poster_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      hero_url: null,
      hero_kind: null,
      hero_poster_url: null,
      hero_focal_x: 0.5,
      hero_focal_y: 0.5,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (profile) {
    const paths: string[] = [];
    for (const url of [profile.hero_url, profile.hero_poster_url] as (string | null)[]) {
      if (!url) continue;
      const part = url.split(`/profile-hero/`)[1];
      if (part) paths.push(part);
    }
    if (paths.length > 0) {
      try { await supabase.storage.from("profile-hero").remove(paths); } catch {}
    }
  }

  revalidatePath("/profile/edit");
  revalidatePath("/profile/[username]", "page");
  return { ok: true };
}
