"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TAP_TTL_MS, type TapTargetType } from "@/lib/taps";

export type TapResult = { ok: boolean; onCooldown?: boolean; error?: string };

/**
 * Tap a profile or a listing. A tap is a one-shot interest signal with a
 * 24h cooldown — you can only tap the same target once per 24 hours. After
 * the tap expires, tapping again lands a fresh tap.
 */
export async function tapAction(
  targetType: TapTargetType,
  targetId: string,
): Promise<TapResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to tap." };

  let ownerId: string | null = null;
  if (targetType === "profile") {
    ownerId = targetId;
  } else {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("owner_id")
      .eq("id", targetId)
      .maybeSingle();
    ownerId = (opp?.owner_id as string | undefined) ?? null;
  }

  if (!ownerId) return { ok: false, error: "That listing no longer exists." };
  if (ownerId === user.id) return { ok: false, error: "You can't tap your own." };

  const { data: existing } = await supabase
    .from("taps")
    .select("id, created_at")
    .eq("tapper_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const ageMs = Date.now() - new Date(existing.created_at as string).getTime();
    if (ageMs < TAP_TTL_MS) {
      return {
        ok: false,
        onCooldown: true,
        error: "You can only tap someone once every 24 hours.",
      };
    }
    // The previous tap has expired — clear it so a fresh one can land.
    await supabase.from("taps").delete().eq("id", existing.id);
  }

  const { error } = await supabase.from("taps").insert({
    tapper_id: user.id,
    owner_id: ownerId,
    target_type: targetType,
    target_id: targetId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/taps");
  return { ok: true };
}
