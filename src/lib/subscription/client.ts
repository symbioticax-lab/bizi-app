'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SubscriptionTier } from './tiers'
import { getTierLimits, TIER_NAMES, isPaidTier } from './tiers'

interface UseSubscriptionReturn {
  tier: SubscriptionTier
  limits: ReturnType<typeof getTierLimits>
  tierName: string
  isPaid: boolean
  isLoading: boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      if (data?.subscription_tier) setTier(data.subscription_tier as SubscriptionTier)
      setIsLoading(false)
    }

    load()
  }, [])

  return {
    tier,
    limits: getTierLimits(tier),
    tierName: TIER_NAMES[tier],
    isPaid: isPaidTier(tier),
    isLoading,
  }
}
