'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TIER_NAMES, TIER_PRICES } from '@/lib/subscription/tiers'

export default function UpgradePage() {
  const params = useSearchParams()
  const router = useRouter()
  const billing = (params.get('billing') ?? 'annual') as 'annual' | 'monthly'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const prices = TIER_PRICES.pro
  const displayPrice = billing === 'annual' ? prices.annualMonthly : prices.monthly
  const billingLabel = billing === 'annual'
    ? `$${prices.annual.toFixed(2)}/yr (locked in for 1 year)`
    : `$${prices.monthly.toFixed(2)}/mo`

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro', billing }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-sm py-16 space-y-8">
      <div className="text-center space-y-3">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-muted text-primary">
          <Zap className="size-7" />
        </span>
        <h1 className="text-2xl font-bold">Upgrade to {TIER_NAMES.pro}</h1>
        <p className="text-muted-foreground text-sm">
          You&apos;ll be charged <strong>{billingLabel}</strong>
          {billing === 'annual' && ` ($${displayPrice.toFixed(2)}/mo equivalent)`}.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="space-y-3">
        <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
          {loading ? 'Redirecting to checkout…' : `Continue to checkout →`}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => router.push('/pricing')}>
          Compare plans
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Stripe. Monthly plans can be cancelled anytime.
      </p>
    </div>
  )
}
