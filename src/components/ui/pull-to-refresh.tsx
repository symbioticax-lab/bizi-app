"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TRIGGER_DELTA  = 80;  // raw px of drag needed to trigger
const REFRESH_HOLD   = 1400; // ms to show spinner before hiding

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // progress: 0 → 1 (visual only); phase drives what's rendered
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "pulling" | "releasing" | "refreshing">("idle");

  // Refs for event-handler state (avoid stale closures)
  const phaseRef   = useRef(phase);
  const startY     = useRef(0);
  const rawDelta   = useRef(0);
  const tracking   = useRef(false);

  function setPhaseSync(p: typeof phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  // ── Resistance curve: logarithmic so fast swipes don't overshoot ──────
  function deltaToProgress(delta: number) {
    return Math.min(Math.log1p(delta) / Math.log1p(TRIGGER_DELTA), 1);
  }

  const triggerRefresh = useCallback(() => {
    setPhaseSync("refreshing");
    setProgress(1);
    router.refresh();
    setTimeout(() => {
      setPhaseSync("idle");
      setProgress(0);
    }, REFRESH_HOLD);
  }, [router]);

  useEffect(() => {
    function scrollTop() {
      // App-shell layout: <main> scrolls, not the window
      return document.querySelector("main")?.scrollTop ?? window.scrollY ?? 0;
    }

    // ─── Touch ──────────────────────────────────────────────────────────
    function onTouchStart(e: TouchEvent) {
      if (scrollTop() > 4 || phaseRef.current === "refreshing") return;
      startY.current   = e.touches[0].clientY;
      rawDelta.current = 0;
      tracking.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking.current || phaseRef.current === "refreshing") return;
      const d = e.touches[0].clientY - startY.current;
      if (d <= 0) { tracking.current = false; return; }
      rawDelta.current = d;
      const prog = deltaToProgress(d);
      setProgress(prog);
      if (phaseRef.current !== "pulling") setPhaseSync("pulling");
    }

    function onTouchEnd() {
      if (!tracking.current || phaseRef.current === "refreshing") return;
      tracking.current = false;
      if (rawDelta.current >= TRIGGER_DELTA) {
        triggerRefresh();
      } else {
        setPhaseSync("idle");
        setProgress(0);
      }
    }

    // ─── Mouse — desktop / trackpad downward drag from scroll-top ───────
    let mTracking  = false;
    let mStartY    = 0;
    let mRawDelta  = 0;

    function onMouseDown(e: MouseEvent) {
      if (scrollTop() > 4 || phaseRef.current === "refreshing") return;
      mStartY   = e.clientY;
      mTracking = true;
      mRawDelta = 0;
    }

    function onMouseMove(e: MouseEvent) {
      if (!mTracking || phaseRef.current === "refreshing") return;
      const d = e.clientY - mStartY;
      if (d <= 0) { mTracking = false; return; }
      mRawDelta = d;
      const prog = deltaToProgress(d);
      setProgress(prog);
      if (phaseRef.current !== "pulling") setPhaseSync("pulling");
    }

    function onMouseUp() {
      if (!mTracking) return;
      mTracking = false;
      if (phaseRef.current === "refreshing") return;
      if (mRawDelta >= TRIGGER_DELTA) {
        triggerRefresh();
      } else if (phaseRef.current === "pulling") {
        setPhaseSync("idle");
        setProgress(0);
      }
    }

    document.addEventListener("touchstart",  onTouchStart, { passive: true });
    document.addEventListener("touchmove",   onTouchMove,  { passive: true });
    document.addEventListener("touchend",    onTouchEnd,   { passive: true });
    document.addEventListener("mousedown",   onMouseDown);
    document.addEventListener("mousemove",   onMouseMove);
    document.addEventListener("mouseup",     onMouseUp);

    return () => {
      document.removeEventListener("touchstart",  onTouchStart);
      document.removeEventListener("touchmove",   onTouchMove);
      document.removeEventListener("touchend",    onTouchEnd);
      document.removeEventListener("mousedown",   onMouseDown);
      document.removeEventListener("mousemove",   onMouseMove);
      document.removeEventListener("mouseup",     onMouseUp);
    };
  }, [triggerRefresh]);

  // ── Indicator position ────────────────────────────────────────────────
  // Pill is ~36px tall, anchored at top-14 (56px = header bottom).
  // translateY: -44px = hidden above header | +8px = resting visibly below it
  const HIDDEN_Y =  -44;
  const SHOWN_Y  =    8;
  const isRefreshing = phase === "refreshing";
  const isVisible    = phase !== "idle";

  const translateY = isRefreshing
    ? SHOWN_Y
    : isVisible
    ? HIDDEN_Y + progress * (SHOWN_Y - HIDDEN_Y + 44) // 0 → fully shown
    : HIDDEN_Y;

  // Smooth spring-back when releasing; no transition while tracking (feels instant)
  const useSpring = isRefreshing || phase === "idle";

  return (
    <>
      {/* ── Pull indicator ─────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-14 z-[60] -translate-x-1/2"
        style={{
          transform: `translateX(-50%) translateY(${translateY}px)`,
          transition: useSpring
            ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s"
            : "opacity 0.15s",
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2",
            "border border-white/[0.10] bg-[hsl(230,22%,10%)]",
            "text-[12px] font-medium text-white/75",
            "shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.55),0_2px_10px_-2px_rgb(0_0_0/0.55)]",
          )}
        >
          {/* Icon — rotates proportionally while pulling, spins when refreshing */}
          <RefreshCw
            className={cn(
              "size-3.5 text-primary",
              isRefreshing && "animate-spin",
            )}
            style={!isRefreshing ? { transform: `rotate(${progress * 360}deg)`, transition: "none" } : undefined}
          />
          <span>
            {isRefreshing
              ? "Refreshing…"
              : progress >= 1
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      </div>

      {children}
    </>
  );
}
