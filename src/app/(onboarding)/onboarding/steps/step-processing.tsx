"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

const LINES = [
  "Scanning who needs what you offer…",
  "Checking skill overlaps…",
  "Sorting by craft and location…",
  "Almost ready…",
];

export function StepProcessing() {
  const router = useRouter();
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIdx((i) => (i + 1) % LINES.length);
    }, 900);

    const advance = setTimeout(() => {
      router.push("/onboarding?step=5");
    }, 3800);

    return () => {
      clearInterval(lineTimer);
      clearTimeout(advance);
    };
  }, [router]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-10 py-10 text-center">
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.35),transparent_60%)] blur-2xl" />
        <div className="relative size-32 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin [animation-duration:1.4s]" />
          <div className="absolute inset-6 rounded-full border border-white/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="size-7 text-primary" />
          </div>
        </div>
      </div>

      <div className="space-y-3 max-w-xs">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
          Finding your people.
        </h1>
        <p className="min-h-[20px] text-sm leading-relaxed text-muted-foreground transition-opacity">
          {LINES[lineIdx]}
        </p>
      </div>
    </div>
  );
}
