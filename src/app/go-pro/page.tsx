import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { GoProPage } from '@/components/subscription/go-pro-page'

export const metadata = { title: 'Upgrade · BIZI' }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentTier: 'free' | 'pro' = 'free'
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const tier = data?.subscription_tier
    currentTier = tier === 'pro' ? 'pro' : 'free'
  }

  const [proMonthly, proAnnual] = await Promise.all([
    stripe.prices.retrieve(process.env.STRIPE_PRICE_PRO_MONTHLY!),
    stripe.prices.retrieve(process.env.STRIPE_PRICE_PRO_ANNUAL!),
  ])

  const prices = {
    pro: {
      monthly:       (proMonthly.unit_amount ?? 0) / 100,
      annual:        (proAnnual.unit_amount  ?? 0) / 100,
      annualMonthly: (proAnnual.unit_amount  ?? 0) / 100 / 12,
    },
  }

  return (
    <GoProPage
      prices={prices}
      currentTier={currentTier}
    />
  )
}
