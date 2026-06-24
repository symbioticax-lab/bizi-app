import { Sparkles, Star, Check } from "lucide-react";

/**
 * Stacked "notification card" mockup that lives at the top of the auth
 * pages. Three layered glass cards — the back two are reduced to just
 * their top edge so the front card carries the message. Content is
 * intentionally fake-but-plausible to telegraph the value prop:
 * 1. New match landed
 * 2. Trade closed with a five-star review
 * 3. Discovery prompt
 *
 * Visual hierarchy: lighter glass than the cosmic background to give a
 * clear morphism read, lime accent inside the front card for brand pop.
 */
export function NotificationStack() {
  return (
    <div className="relative w-full">
      {/* Back-card peek — narrowest, dimmest. Only its top edge sits above
         the front card, like a card buried at the bottom of a deck. */}
      <div className="mx-10 h-2 rounded-t-2xl border border-b-0 border-white/[0.06] bg-white/[0.03] backdrop-blur-md" />

      {/* Middle-card peek — slightly wider and brighter. */}
      <div className="mx-5 -mt-[3px] h-2.5 rounded-t-2xl border border-b-0 border-white/[0.09] bg-white/[0.05] backdrop-blur-md" />

      {/* Front card — full content. Slightly lighter glass than the
         background plus an inner highlight + soft drop shadow gives it
         clear separation against the cosmic backdrop. */}
      <div className="-mt-[3px] rounded-2xl border border-white/[0.14] bg-white/[0.08] p-3.5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_60px_-24px_rgba(0,0,0,0.55)]">
        <NotificationRow
          icon={<Sparkles className="size-4" />}
          title="New match · just now"
          subtitle="Sarah needs your design work"
          detail="Brooklyn · in exchange for 3 haircuts"
          status={
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          }
        />

        {/* Second row, separated — hints that the front card is itself a
           feed of multiple updates. */}
        <div className="mt-3 border-t border-white/[0.08] pt-3">
          <NotificationRow
            icon={<Star className="size-4 fill-primary" />}
            title="Trade closed · 5★"
            subtitle="Marcus rated your photoshoot"
            detail="Park Slope · +50 BIZI pts earned"
          />
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  icon,
  title,
  subtitle,
  detail,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  detail: string;
  status?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {title}
        </p>
        <p className="truncate text-[12px] leading-tight text-foreground/85">
          {subtitle}
        </p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {detail}
        </p>
      </div>
      {status}
    </div>
  );
}
