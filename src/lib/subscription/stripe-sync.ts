import Stripe from 'stripe'
import { upsertSubscription } from './server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubscriptionTier, SubscriptionStatus } from './tiers'

// Single shared Stripe client for all server-side subscription syncing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Map Stripe Price ID → tier name
export function priceIdToTier(priceId: string): SubscriptionTier {
  const map: Record<string, SubscriptionTier> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL!]: 'pro',
  }
  return map[priceId] ?? 'free'
}

export function stripeStatusToLocal(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    incomplete: 'incomplete',
    incomplete_expired: 'cancelled',
    unpaid: 'past_due',
    paused: 'past_due',
  }
  return map[status] ?? 'active'
}

/**
 * Resolve the local user_id for a Stripe subscription. Tries, in order:
 *   1. subscription_data.metadata.user_id (set at checkout creation)
 *   2. the subscriptions row keyed by stripe_customer_id
 *   3. the Stripe customer's metadata.user_id
 * Returns null if none resolve.
 */
async function resolveUserId(sub: Stripe.Subscription, customerId: string): Promise<string | null> {
  const fromSub = sub.metadata?.user_id
  if (fromSub) return fromSub

  const admin = createAdminClient()
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (data?.user_id) return data.user_id as string

  const customer = await stripe.customers.retrieve(customerId)
  const fromCustomer = (customer as Stripe.Customer).metadata?.user_id
  return fromCustomer ?? null
}

/**
 * Single source of truth for writing a Stripe subscription into our DB.
 * Used by BOTH the Stripe webhook and the post-checkout reconcile so the
 * user's tier updates the moment either path runs — never dependent on the
 * webhook alone. Mirrors to profiles.subscription_tier via the DB trigger.
 */
export async function syncSubscriptionFromStripe(sub: Stripe.Subscription): Promise<void> {
  const customerId = sub.customer as string
  const firstItem = sub.items.data[0]
  const priceId = firstItem?.price.id ?? ''
  const tier = priceIdToTier(priceId)
  const status = stripeStatusToLocal(sub.status)
  // In Stripe v22+, current_period_end lives on SubscriptionItem
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null

  const userId = await resolveUserId(sub, customerId)
  if (!userId) return

  await upsertSubscription({
    user_id: userId,
    tier,
    status,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_end: periodEnd ?? new Date().toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  })
}

/**
 * Reconcile a completed Checkout Session straight from Stripe — called on the
 * upgrade-success page so the tier is applied immediately on return, even if
 * the webhook is delayed or not reachable (e.g. local dev). Safe to run more
 * than once (upsert by user_id).
 */
export async function reconcileCheckoutSession(sessionId: string): Promise<SubscriptionTier | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  })

  const sub = session.subscription
  if (!sub || typeof sub === 'string') return null

  await syncSubscriptionFromStripe(sub)

  const priceId = sub.items.data[0]?.price.id ?? ''
  return priceIdToTier(priceId)
}
