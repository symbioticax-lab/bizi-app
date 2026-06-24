"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Star, ArrowLeftRight, Target, Building2 } from "lucide-react";

const INTENTS = [
  {
    id: "need-help",
    label: "Need Creative Help",
    sub: "Find creators to work with",
    icon: Sparkles,
    color: "bg-primary/20 text-primary border-primary/20",
  },
  {
    id: "offer-services",
    label: "Offer My Services",
    sub: "Put your skills to work",
    icon: Star,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  },
  {
    id: "trade-skills",
    label: "Trade Skills / Resources",
    sub: "Swap value, no money needed",
    icon: ArrowLeftRight,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  },
  {
    id: "post-opportunity",
    label: "Post Opportunity",
    sub: "Share a gig or collab",
    icon: Target,
    color: "bg-rose-500/20 text-rose-400 border-rose-500/20",
  },
  {
    id: "share-resources",
    label: "Share Studio / Resources",
    sub: "Lend space or equipment",
    icon: Building2,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  },
] as const;

type Props = { onSelect: (intent: string) => void };

export function Step1Intent({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-8 px-5 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">What brings you here?</h2>
        <p className="text-sm text-white/45">Choose your intent — we'll build the rest.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {INTENTS.map((item, i) => {
          const Icon = item.icon;
          const isLast = i === INTENTS.length - 1;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border p-4 text-left",
                "bg-white/[0.035] border-white/[0.07]",
                "transition-all duration-200",
                "hover:bg-white/[0.07] hover:border-white/[0.15] hover:scale-[1.02]",
                "active:scale-[0.97]",
                isLast && "col-span-2",
              )}
            >
              <div className={cn("flex size-10 items-center justify-center rounded-xl border", item.color)}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold leading-tight text-white/90">{item.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/38">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
