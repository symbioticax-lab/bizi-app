import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_MAP: Record<string, string | undefined> = {
  'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
  'pro-annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { tier, billing } = body as { tier: string; billing: string }

  const priceKey = `${tier}-${billing}` as keyof typeof PRICE_MAP
  const priceId = PRICE_MAP[priceKey]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier/billing combo' }, { status: 400 })

  // Retrieve or create Stripe customer
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = sub?.stripe_customer_id

  if (!customerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.display_name ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id

    await admin
      .from('subscriptions')
      .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/pricing`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
  })

  return NextResponse.json({ url: session.url })
}
