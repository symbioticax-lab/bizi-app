import { Gift, Users, Sparkles, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareButton, CopyLinkButton } from "./share-button";
import { REFERRAL_TIERS, shareMessageFor } from "@/lib/referrals";
import type { ReferralState } from "@/lib/referral-state";
import { cn } from "@/lib/utils";

type Props = {
  state: ReferralState;
  displayName: string;
};

/**
 * Owner-only referral card. Sits below the JourneyCard on the owner's profile.
 * Visible code + share button up top; tier ladder below with current tier
 * highlighted; locked tiers show what's needed to unlock them.
 */
export function ReferralCard({ state, displayName }: Props) {
  if (!state.code || !state.shareUrl) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Your referral code will appear here once your profile is fully set up.
          </p>
        </CardContent>
      </Card>
    );
  }

  const message = shareMessageFor(state.code, displayName);

  return (
    <Card>
      <CardContent className="space-y-5 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invite friends
            </p>
            <p className="text-base font-semibold">
              You're a Lvl {state.currentTier.num} <span className="text-primary">{state.currentTier.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {state.count > 0 ? (
                <><span className="text-foreground font-medium">{state.count}</span> {state.count === 1 ? "person has" : "people have"} joined through you</>
              ) : (
                "Bring your first friend to unlock your first reward"
              )}
            </p>
          </div>
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Gift className="size-5" />
          </span>
        </div>

        {/* Code + share */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your code
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-card/40 p-2 pl-4">
            <span className="font-mono text-base font-semibold tracking-wider">{state.code}</span>
            <span className="ml-auto truncate text-xs text-muted-foreground">{state.shareUrl}</span>
            <CopyLinkButton value={state.shareUrl} />
          </div>
          <ShareButton
            shareUrl={message.url}
            shareTitle={message.title}
            shareText={message.text}
            className="w-full"
          />
        </div>

        {/* Progress to next tier */}
        {state.nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {state.needed} to <span className="font-medium text-foreground">Lvl {state.nextTier.num} — {state.nextTier.name}</span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {state.count} / {state.nextTier.threshold}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${state.pctToNext}%` }}
              />
            </div>
          </div>
        )}

        {/* Tier ladder */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rewards
          </p>
          <ul className="space-y-2">
            {REFERRAL_TIERS.map((t) => {
              const reached = state.count >= t.threshold;
              const current = t.num === state.currentTier.num;
              return (
                <li
                  key={t.num}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                    current
                      ? "border-primary/40 bg-primary/[0.08]"
                      : reached
                        ? "border-white/[0.08] bg-card/40"
                        : "border-white/[0.04] bg-card/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {reached ? <Sparkles className="size-4" /> : <Lock className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("font-medium", !reached && "text-foreground/70")}>
                        Lvl {t.num} — {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.threshold === 0 ? "default" : `${t.threshold} ${t.threshold === 1 ? "referral" : "referrals"}`}
                      </span>
                      {current && <Badge>Current</Badge>}
                      {reached && t.hasBadge && <Badge variant="muted">Badge</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="text-foreground/85">{t.perk}.</span> {t.perkDetail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          New signups count as soon as they confirm their email.
        </p>
      </CardContent>
    </Card>
  );
}
