export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete'

export interface TierLimits {
  listings: number           // max active listings (Infinity = unlimited)
  connections_per_month: number
  trips: number              // max active trips at once
  boosts_per_month: number
  folders: number            // max bookmark folders
  profile_views: boolean     // can see who viewed their profile
  taps_views: boolean        // can see who tapped their listings
  verified_badge: boolean    // verified badge on profile
  analytics: boolean         // full analytics dashboard
  featured_listing: boolean  // featured placement in category
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    listings: 3,
    connections_per_month: 5,
    trips: 1,
    boosts_per_month: 0,
    folders: 3,
    profile_views: false,
    taps_views: false,
    verified_badge: false,
    analytics: false,
    featured_listing: false,
  },
  pro: {
    listings: 10,
    connections_per_month: Infinity,
    trips: Infinity,
    boosts_per_month: 1,
    folders: Infinity,
    profile_views: true,
    taps_views: true,
    verified_badge: true,
    analytics: false,
    featured_listing: false,
  },
}

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Bizi Basic',
  pro: 'Bizi Plus+',
}

export const TIER_PRICES = {
  pro: { monthly: 14.99, annual: 120.00, annualMonthly: 10.00 },
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free
}

export function canUseFeature(tier: SubscriptionTier, feature: keyof Pick<TierLimits, 'profile_views' | 'taps_views' | 'verified_badge' | 'analytics' | 'featured_listing'>): boolean {
  return (TIER_LIMITS[tier] ?? TIER_LIMITS.free)[feature]
}

export function isAtListingLimit(tier: SubscriptionTier, activeListings: number): boolean {
  return activeListings >= (TIER_LIMITS[tier] ?? TIER_LIMITS.free).listings
}

export function isAtConnectionLimit(tier: SubscriptionTier, monthlyConnections: number): boolean {
  const limit = (TIER_LIMITS[tier] ?? TIER_LIMITS.free).connections_per_month
  return limit !== Infinity && monthlyConnections >= limit
}

export function isAtTripLimit(tier: SubscriptionTier, activeTrips: number): boolean {
  const limit = (TIER_LIMITS[tier] ?? TIER_LIMITS.free).trips
  return limit !== Infinity && activeTrips >= limit
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier === 'pro'
}
