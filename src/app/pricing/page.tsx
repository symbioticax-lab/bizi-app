import { createClient } from '@/lib/supabase/server'
import { TIER_PRICES } from '@/lib/subscription/tiers'
import { PricingCards } from '@/components/subscription/pricing-cards'

export const metadata = { title: 'Pricing · BIZI' }

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentTier = 'free'
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    currentTier = data?.subscription_tier ?? 'free'
  }

  return (
    <div className="container max-w-5xl py-12 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Trade freely on BIZI. Upgrade when you want more visibility, more connections, and more tools.
        </p>
      </div>

      <PricingCards
        prices={TIER_PRICES}
        currentTier={currentTier}
        isLoggedIn={!!user}
      />

      <p className="text-center text-xs text-muted-foreground">
        All prices in USD. Cancel anytime — no lock-in. Annual plans are billed once per year.
      </p>
    </div>
  )
}
