'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TIER_PRICES } from '@/lib/subscription/tiers'

interface Props {
  prices: typeof TIER_PRICES
  currentTier: string
  isLoggedIn: boolean
}

const FREE_FEATURES = [
  '3 active listings',
  'Full trade system (propose → negotiate → complete)',
  'Discovery feed & basic filters',
  '5 connection requests/month',
  '1 active trip at a time',
  '3 bookmark folders',
  'Taps, reviews & notifications',
  'Referral & onboarding rewards',
]

const PLUS_FEATURES = [
  'Everything in Free',
  '10 active listings',
  'Unlimited connection requests',
  'Unlimited active trips',
  'Unlimited bookmark folders',
  'See who viewed your profile',
  'See who tapped your listings',
  'Verified badge on profile',
  '1 listing boost/month (48h top placement)',
  'Priority in discovery feed',
  'Early access to new features',
]

export function PricingCards({ prices, currentTier, isLoggedIn }: Props) {
  const [annual, setAnnual] = useState(true)

  function getHref() {
    if (!isLoggedIn) return `/login?next=/pricing`
    return `/upgrade?tier=pro&billing=${annual ? 'annual' : 'monthly'}`
  }

  const displayPrice = annual ? prices.pro.annualMonthly : prices.pro.monthly

  return (
    <div className="space-y-6">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setAnnual(false)}
          className={cn('text-sm font-medium transition-colors', !annual ? 'text-foreground' : 'text-muted-foreground')}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(s => !s)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
            annual ? 'bg-primary' : 'bg-muted'
          )}
          role="switch"
          aria-checked={annual}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
              annual ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={cn('text-sm font-medium transition-colors', annual ? 'text-foreground' : 'text-muted-foreground')}
        >
          Annual
          <Badge variant="secondary" className="ml-2 text-[10px] py-0">Save 33%</Badge>
        </button>
      </div>

      {/* Cards — Plus+ | Free */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start max-w-2xl mx-auto">

        {/* Bizi Plus+ — recommended */}
        <div className="rounded-2xl border-2 border-primary bg-card p-6 space-y-5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="text-[10px] px-3 py-1">Most popular</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bizi Plus+</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground mb-1">/mo</span>
            </div>
            {annual ? (
              <p className="text-xs text-muted-foreground">
                ${prices.pro.annual.toFixed(2)}/yr · save ${(prices.pro.monthly * 12 - prices.pro.annual).toFixed(0)}/yr
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">billed monthly, cancel anytime</p>
            )}
          </div>

          <Button asChild className="w-full" disabled={currentTier === 'pro'}>
            <a href={currentTier === 'pro' ? '#' : getHref()}>
              {currentTier === 'pro' ? 'Current plan' : 'Get Bizi Plus+'}
            </a>
          </Button>

          <ul className="space-y-2">
            {PLUS_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="size-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bizi Basic — Free */}
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bizi Basic</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-sm text-muted-foreground mb-1">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground">Free forever</p>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full"
            disabled={currentTier === 'free'}
          >
            <a href={currentTier === 'free' ? '#' : '/dashboard'}>
              {currentTier === 'free' ? 'Current plan' : 'Downgrade'}
            </a>
          </Button>

          <ul className="space-y-2">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
