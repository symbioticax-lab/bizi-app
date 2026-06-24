import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubscriptionTier, SubscriptionStatus } from './tiers'

export interface UserSubscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

// Returns subscription for the currently logged-in user (uses RLS-scoped client)
export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('tier, status, trial_ends_at, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  return data as UserSubscription | null
}

// Lightweight tier-only read — uses cached column on profiles for speed
export async function getUserTier(userId?: string): Promise<SubscriptionTier> {
  const supabase = createClient()
  let uid = userId
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser()
    uid = user?.id
  }
  if (!uid) return 'free'

  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', uid)
    .single()

  return (data?.subscription_tier as SubscriptionTier) ?? 'free'
}

// Returns current-period usage for a user — admin client since usage is service-side
export async function getMonthlyUsage(userId: string) {
  const admin = createAdminClient()
  const period = new Date()
  period.setDate(1)
  const periodStart = period.toISOString().slice(0, 10)

  const { data } = await admin
    .from('subscription_usage')
    .select('connection_requests, boosts_used')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .single()

  return { connection_requests: data?.connection_requests ?? 0, boosts_used: data?.boosts_used ?? 0 }
}

// Increment a usage counter — called from Server Actions after a gate check passes
export async function incrementUsage(userId: string, field: 'connection_requests' | 'boosts_used') {
  const admin = createAdminClient()
  const period = new Date()
  period.setDate(1)
  const periodStart = period.toISOString().slice(0, 10)

  await admin.rpc('increment_subscription_usage', { p_user_id: userId, p_field: field, p_period: periodStart })
}

// Upsert subscription from Stripe webhook — service role only
export async function upsertSubscription(data: {
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripe_customer_id: string
  stripe_subscription_id: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_ends_at?: string | null
}) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('subscriptions')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) throw error
}

// Cancel/downgrade on subscription deletion
export async function cancelSubscription(stripeSubscriptionId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('subscriptions')
    .update({ tier: 'free', status: 'cancelled', stripe_subscription_id: null, current_period_end: null, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (error) throw error
}
