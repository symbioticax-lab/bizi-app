'use client'

import { useState } from 'react'
import { Zap, Check, X, Lock, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlanPrice {
  monthly: number
  annual: number
  annualMonthly: number
}

interface Props {
  prices: { pro: PlanPrice }
  currentTier: 'free' | 'pro'
}

const PLUS_BULLETS = [
  '10 active listings (vs. 3 on Basic)',
  'Unlimited connections — no monthly cap',
  'Unlimited active trips',
  'See exactly who viewed your profile',
  'See who tapped your listings',
  'Verified badge on your profile',
  '1 listing boost/month (48h top placement)',
  'Unlimited bookmark folders',
]

type CompareValue = string | boolean
const COMPARE_ROWS: { label: string; basic: CompareValue; plus: CompareValue }[] = [
  { label: 'Active listings',       basic: '3',    plus: '10' },
  { label: 'Connection requests',   basic: '5/mo', plus: 'Unlimited' },
  { label: 'Active trips',          basic: '1',    plus: 'Unlimited' },
  { label: 'Bookmark folders',      basic: '3',    plus: 'Unlimited' },
  { label: 'See who viewed you',    basic: false,  plus: true },
  { label: 'See who tapped you',    basic: false,  plus: true },
  { label: 'Verified badge',        basic: false,  plus: true },
  { label: 'Listing boosts',        basic: '—',    plus: '1/mo' },
]

function CompareCell({ value, accent }: { value: CompareValue; accent?: string }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className={cn('size-3.5 mx-auto', accent ?? 'text-foreground')} strokeWidth={3} />
      : <X className="size-3.5 text-muted-foreground/40 mx-auto" strokeWidth={2.5} />
  }
  return <span className={accent}>{value}</span>
}

export function GoProPage({ prices, currentTier }: Props) {
  const [annual, setAnnual] = useState(true)

  if (currentTier === 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-8 text-primary" />
        </span>
        <h1 className="text-2xl font-bold">You&apos;re on Bizi Plus+</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          You already have access to all premium features BIZI offers. Thanks for being a Plus+ member.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/dashboard">Go to dashboard</a>
        </Button>
      </div>
    )
  }

  const displayPrice = annual ? prices.pro.annualMonthly : prices.pro.monthly
  const ctaHref = `/upgrade?tier=pro&billing=${annual ? 'annual' : 'monthly'}`

  return (
    <div className="flex flex-col min-h-full overflow-y-auto pb-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-6 text-center space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Upgrade your BIZI
        </p>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight">
          Do more. Connect more.<br />Earn more.
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Bizi Plus+ removes every limit that&apos;s slowing you down.
        </p>
      </div>

      {/* ── Billing toggle ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 pb-5">
        <button
          onClick={() => setAnnual(false)}
          className={cn(
            'text-sm font-medium transition-colors',
            !annual ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(s => !s)}
          role="switch"
          aria-checked={annual}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            annual ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
              annual ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={cn(
            'text-sm font-medium transition-colors',
            annual ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Annual
          <Badge variant="secondary" className="ml-1.5 text-[10px] py-0 px-1.5">
            Save 33%
          </Badge>
        </button>
      </div>

      {/* ── Plan panel ───────────────────────────────────────── */}
      <div className="mx-5 mb-6">
        <div className="relative rounded-2xl border border-primary/60 bg-primary/[0.04] p-5 space-y-5">

          {/* Price block */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bizi Plus+</span>
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tracking-tight">
                ${displayPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground mb-1.5">/mo</span>
              {annual && (
                <span className="text-xs text-muted-foreground mb-1.5 ml-0.5">
                  · billed ${prices.pro.annual.toFixed(2)}/yr
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {annual ? 'Locked in for 1 year. Cancel before renewal.' : 'Cancel anytime.'}
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-2.5">
            {PLUS_BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center bg-primary/15 text-primary">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button asChild size="lg" className="w-full font-semibold">
            <a href={ctaHref}>Get Bizi Plus+ →</a>
          </Button>

          {/* Trust line */}
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            Secure checkout · Powered by Stripe
          </p>
        </div>
      </div>

      {/* ── Comparison table ─────────────────────────────────── */}
      <div className="mx-5 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
          Compare plans
        </h2>
        <div className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/[0.06] px-3 py-2.5">
            <span className="text-[11px] font-medium text-muted-foreground" />
            <span className="text-[11px] font-semibold text-center text-muted-foreground">
              Basic
            </span>
            <span className="text-[11px] font-semibold text-center text-primary flex items-center justify-center gap-1">
              <Zap className="size-3" /> Plus+
            </span>
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                'grid grid-cols-[1.5fr_1fr_1fr] px-3 py-2.5',
                i % 2 === 1 && 'bg-white/[0.025]',
                i < COMPARE_ROWS.length - 1 && 'border-b border-white/[0.04]',
              )}
            >
              <span className="text-[11px] text-muted-foreground self-center pr-1">{row.label}</span>
              <span className="text-[11px] font-medium text-center self-center text-muted-foreground">
                <CompareCell value={row.basic} accent="text-muted-foreground" />
              </span>
              <span className="text-[11px] font-medium text-center self-center">
                <CompareCell value={row.plus} accent="text-primary" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Objection-handler strip ───────────────────────────── */}
      <div className="mx-5 grid grid-cols-3 gap-2.5">
        {[
          { icon: Lock,      label: 'Secure',         sub: 'Stripe-encrypted' },
          { icon: RotateCcw, label: 'Cancel anytime',  sub: 'Monthly plans' },
          { icon: Sparkles,  label: 'Instant',         sub: 'Access right away' },
        ].map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-3 text-center"
          >
            <Icon className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-semibold leading-none">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
