import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { cancelSubscription } from '@/lib/subscription/server'
import { stripe, syncSubscriptionFromStripe } from '@/lib/subscription/stripe-sync'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await cancelSubscription((event.data.object as Stripe.Subscription).id)
        break
    }
  } catch (err) {
    console.error('[stripe webhook]', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
