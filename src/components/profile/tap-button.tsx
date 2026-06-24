"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TAP_TTL_MS, type TapTargetType } from "@/lib/taps";
import { tapAction } from "@/app/taps/actions";

const COOLDOWN_MESSAGE = "You can only tap someone once every 24 hours.";

type Props = {
  targetType: TapTargetType;
  targetId: string;
  /** Profile that owns the tapped thing — used to self-hide on your own. */
  ownerId: string;
  /** "pill" for the profile hero, "compact" for discovery cards. */
  variant?: "pill" | "compact";
};

/**
 * Tap a profile or listing — a one-shot interest signal with a 24h cooldown.
 * Once tapped, the button shows a "Tapped" state for 24h; tapping again in
 * that window surfaces a toast instead of sending another tap.
 */
export function TapButton({ targetType, targetId, ownerId, variant = "pill" }: Props) {
  const supabase = createClient();
  const toast = useToast();
  const [tapped, setTapped] = useState(false); // true = within the 24h cooldown
  const [visible, setVisible] = useState<boolean | null>(null); // null = loading
  const [pending, startTransition] = useTransition();
  const freshResetTimer = useRef<ReturnType<typeof setTimeout>>();

  // Clear any pending fresh-tap reset timer on unmount.
  useEffect(() => () => { if (freshResetTimer.current) clearTimeout(freshResetTimer.current); }, []);

  useEffect(() => {
    let cancelled = false;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === ownerId) {
        if (!cancelled) setVisible(false);
        return;
      }
      const { data } = await supabase
        .from("taps")
        .select("created_at")
        .eq("tapper_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle();
      if (cancelled) return;

      if (data) {
        const elapsed = Date.now() - new Date(data.created_at as string).getTime();
        const remaining = TAP_TTL_MS - elapsed;
        if (remaining > 0) {
          setTapped(true);
          // Live reset: flip back to tappable the moment the 24h window closes,
          // even if the page stays open. setTimeout is capped to a safe max.
          resetTimer = setTimeout(() => setTapped(false), Math.min(remaining, 2_147_483_647));
        } else {
          setTapped(false);
        }
      } else {
        setTapped(false);
      }
      setVisible(true);
    }

    load();
    return () => {
      cancelled = true;
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [targetType, targetId, ownerId, supabase]);

  function handleClick() {
    if (pending) return;
    // Already tapped within the last 24h — explain the cooldown.
    if (tapped) {
      toast(COOLDOWN_MESSAGE);
      return;
    }
    setTapped(true); // optimistic
    startTransition(async () => {
      const result = await tapAction(targetType, targetId);
      if (result.ok) {
        // Live reset: auto-clear 24h from now even if the page stays open.
        if (freshResetTimer.current) clearTimeout(freshResetTimer.current);
        freshResetTimer.current = setTimeout(() => setTapped(false), TAP_TTL_MS);
        return;
      }
      if (result.onCooldown) {
        toast(result.error ?? COOLDOWN_MESSAGE); // stay in the tapped state
      } else {
        setTapped(false); // revert
        toast(result.error ?? "Couldn't tap right now.");
      }
    });
  }

  if (visible !== true) return null;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={tapped}
        aria-label={tapped ? "Tapped" : "Tap"}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors",
          tapped
            ? "bg-primary text-primary-foreground"
            : "bg-black/45 text-white hover:bg-black/65",
        )}
      >
        <Hand className={cn("size-4", tapped && "fill-current")} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={pending}
      size="sm"
      aria-pressed={tapped}
      className={cn(
        "gap-1.5 rounded-full backdrop-blur-md transition-colors",
        tapped
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-white/20 bg-black/45 text-white hover:bg-black/65",
      )}
    >
      <Hand className={cn("size-4", tapped && "fill-current")} />
      {tapped ? "Tapped" : "Tap"}
    </Button>
  );
}
