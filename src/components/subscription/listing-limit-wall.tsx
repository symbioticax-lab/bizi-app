'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TIER_NAMES, TIER_PRICES } from '@/lib/subscription/tiers'

const PLUS_HIGHLIGHTS = [
  '10 active listings (vs your 3)',
  'Unlimited connection requests',
  'See who viewed & tapped your listings',
  'Verified badge on your profile',
  '1 listing boost/month (48h top placement)',
]

interface Props {
  currentTierName: string
  currentLimit: number
  nextTierLimitLabel: string
}

export function ListingLimitWall({ currentTierName, currentLimit, nextTierLimitLabel }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'limit' | 'plans'>('limit')
  const [annual, setAnnual] = useState(true)

  if (step === 'limit') {
    return (
      <div className="container max-w-sm py-20 text-center space-y-6">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Zap className="size-7" />
        </span>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">You&apos;ve reached your listing limit</h1>
          <p className="text-sm text-muted-foreground">
            {currentTierName} accounts can have up to {currentLimit} active listings.
            Upgrade to post {nextTierLimitLabel}.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setStep('plans')}>
            Upgrade →
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const displayPrice = annual ? TIER_PRICES.pro.annualMonthly : TIER_PRICES.pro.monthly

  return (
    <div className="container max-w-sm py-12 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">Upgrade to {TIER_NAMES.pro}</h2>
        <p className="text-sm text-muted-foreground">Unlock 10 active listings and much more.</p>
      </div>

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

      {/* Plan card */}
      <div className="rounded-2xl border-2 border-primary bg-card p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {TIER_NAMES.pro}
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground mb-1">/mo</span>
          </div>
          {annual ? (
            <p className="text-xs text-muted-foreground">
              ${TIER_PRICES.pro.annual.toFixed(2)}/yr · save ${(TIER_PRICES.pro.monthly * 12 - TIER_PRICES.pro.annual).toFixed(0)}/yr
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">billed monthly</p>
          )}
        </div>
        <Button
          className="w-full"
          onClick={() => router.push(`/upgrade?tier=pro&billing=${annual ? 'annual' : 'monthly'}`)}
        >
          Get {TIER_NAMES.pro}
        </Button>
        <ul className="space-y-2">
          {PLUS_HIGHLIGHTS.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="size-4 text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Stripe. Cancel anytime from your account settings.
      </p>

      <div className="text-center">
        <button
          onClick={() => setStep('limit')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Go back
        </button>
      </div>
    </div>
  )
}
