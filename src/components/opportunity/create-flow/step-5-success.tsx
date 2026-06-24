"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/share-button";

type Props = { opportunityId: string; intent: string };

const SUCCESS_COPY: Record<string, { headline: string; sub: string; viewLabel: string }> = {
  "need-help":        { headline: "Request posted ✦",    sub: "Creators can now discover and reach out about your project.",   viewLabel: "View Request" },
  "offer-services":   { headline: "You're live ✦",       sub: "Your services listing is now visible to the whole network.",     viewLabel: "View Listing" },
  "trade-skills":     { headline: "Trade posted ✦",      sub: "The right person for this swap will find you.",                  viewLabel: "View Trade" },
  "post-opportunity": { headline: "Opportunity live ✦",  sub: "Creators can now find and apply to your opportunity.",           viewLabel: "View Opportunity" },
  "share-resources":  { headline: "Resource listed ✦",   sub: "People looking for space or gear can now find you.",             viewLabel: "View Listing" },
};

const NEXT_STEPS = [
  { icon: Sparkles, text: "Creators can now discover and react to your listing" },
  { icon: Users2,   text: "Start a trade when someone reaches out" },
] as const;

export function Step5Success({ opportunityId, intent }: Props) {
  const opportunityUrl = `/opportunities/${opportunityId}`;
  const copy = SUCCESS_COPY[intent] ?? SUCCESS_COPY["post-opportunity"];

  return (
    <div className="flex flex-col items-center gap-8 px-5 py-12 text-center animate-in fade-in duration-500">
      {/* Checkmark with glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/20">
          <CheckCircle2 className="size-10 text-primary" />
        </div>
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">{copy.headline}</h2>
        <p className="max-w-[260px] text-sm text-white/50">{copy.sub}</p>
      </div>

      {/* Next steps */}
      <div className="w-full space-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">What's next</p>
        <div className="space-y-3 pt-1">
          {NEXT_STEPS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Icon className="size-3.5 text-primary" />
              </div>
              <p className="text-[13px] leading-snug text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex w-full flex-col gap-3">
        <Link
          href={opportunityUrl}
          className={cn(
            "w-full rounded-2xl py-4 text-center",
            "text-[15px] font-semibold text-white",
            "bg-gradient-to-r from-violet-600 via-primary to-violet-500",
            "shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]",
            "transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
          )}
        >
          {copy.viewLabel}
        </Link>

        <ShareButton
          url={opportunityUrl}
          title="Check out this listing on BIZI"
          text="Found this creative opportunity — thought you might be interested."
          variant="pill"
          className={cn(
            "w-full justify-center rounded-2xl py-4",
            "text-[15px] font-semibold",
            "border-white/[0.10] bg-white/[0.04] text-white/70",
            "hover:bg-white/[0.08] hover:text-white",
          )}
        />

        <Link
          href="/"
          className="rounded-2xl py-3 text-[14px] text-white/35 transition-colors hover:text-white/60"
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
