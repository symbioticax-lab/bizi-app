import Link from "next/link";
import { Check, ChevronRight, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QUESTS } from "@/lib/quests";
import type { JourneyState } from "@/lib/quest-state";
import { cn } from "@/lib/utils";

type Props = {
  state: JourneyState;
  /** The owner's username, used to rewrite quest hrefs to their profile. */
  username: string;
};

/**
 * Quests defined in lib/quests.ts use placeholder hrefs (e.g. "#avatar")
 * because they don't know the owner's username at definition time. This
 * helper rewrites them to real destinations where the action can be done.
 */
function resolveQuestHref(questId: string, defaultHref: string, username: string): string {
  switch (questId) {
    case "avatar":
    case "hero":
      // Both upload affordances are at the top of the user's profile page.
      return `/profile/${username}`;
    case "offering":
      return `/profile/${username}#offerings`;
    case "want":
      return `/profile/${username}#wants`;
    default:
      return defaultHref;
  }
}

/**
 * Owner-only "Your journey" card. Starbucks-style progress meter at the top
 * (level + filled bar with milestones), then the next 3 incomplete quests as
 * actionable rows, then a collapsible "all quests" list.
 *
 * When everything is complete, switches to a celebratory "Trusted" card.
 */
export function JourneyCard({ state, username }: Props) {
  const allDone = state.completedCount === state.total;

  return (
    <Card>
      <CardContent className="space-y-5 p-5 md:p-6">
        <Header state={state} allDone={allDone} />

        {!allDone && state.nextUp.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next up
            </p>
            <ul className="space-y-2">
              {state.nextUp.map((qs) => {
                const def = QUESTS.find((q) => q.id === qs.id);
                if (!def) return null;
                const Icon = def.icon;
                const href = resolveQuestHref(def.id, def.cta.href, username);
                return (
                  <li key={qs.id}>
                    <Link
                      href={href}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-card/40 p-3 transition-colors hover:border-primary/40 hover:bg-card/60"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{def.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        {def.cta.label}
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
            <span className="inline-flex items-center gap-1">
              <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
              {allDone ? "Show all quests" : `Show all ${state.total} quests`}
            </span>
          </summary>
          <ul className="mt-3 space-y-2">
            {QUESTS.map((q) => {
              const status = state.quests.find((s) => s.id === q.id);
              const done = status?.done ?? false;
              const Icon = q.icon;
              return (
                <li
                  key={q.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-white/[0.04] p-2.5 text-sm",
                    done ? "bg-primary/[0.06] text-foreground/80" : "bg-card/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-medium leading-tight", done && "line-through opacity-70")}>
                        {q.title}
                      </span>
                      {done && <Badge variant="muted" className="shrink-0">Done</Badge>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}

function Header({ state, allDone }: { state: JourneyState; allDone: boolean }) {
  if (allDone) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]">
          <Trophy className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Lvl {state.level.num} — {state.level.name}
          </p>
          <p className="text-base font-medium">All quests complete. You're {state.level.perk}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your journey
          </p>
          <p className="mt-0.5 text-base font-semibold">
            Lvl {state.level.num} — {state.level.name}
          </p>
        </div>
        <p className="text-sm font-medium tabular-nums text-muted-foreground">
          <span className="text-foreground">{state.completedCount}</span>
          <span className="mx-1">of</span>
          {state.total}
        </p>
      </div>

      <ProgressBar pct={state.pctComplete} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{state.level.perk}</span>
        {state.nextLevel && (
          <span>
            {state.nextLevel.threshold - state.completedCount} to{" "}
            <span className="font-medium text-foreground">Lvl {state.nextLevel.num} — {state.nextLevel.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
      {/* Milestone notches at 30 / 60 / 100 — match the level thresholds */}
      {[30, 60, 100].map((mark) => (
        <span
          key={mark}
          aria-hidden
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-white/15"
          style={{ left: `${mark}%` }}
        />
      ))}
    </div>
  );
}

export { Header as JourneyHeader, ProgressBar as JourneyProgressBar };
