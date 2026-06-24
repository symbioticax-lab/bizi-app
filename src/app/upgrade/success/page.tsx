import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { reconcileCheckoutSession } from '@/lib/subscription/stripe-sync'
import { TIER_NAMES, type SubscriptionTier } from '@/lib/subscription/tiers'

export const metadata = { title: 'Upgrade successful · BIZI' }
// External Stripe call + fresh per-user read — never cache this page.
export const dynamic = 'force-dynamic'

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Apply the upgrade straight from Stripe instead of waiting on the webhook.
  // This guarantees the tier is live the moment the user lands here, even if
  // the webhook is delayed or unreachable (e.g. local dev). Idempotent.
  if (searchParams.session_id) {
    try {
      await reconcileCheckoutSession(searchParams.session_id)
    } catch (err) {
      console.error('[upgrade/success] reconcile failed', err)
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier ?? 'pro') as SubscriptionTier
  const tierLabel = TIER_NAMES[tier]

  return (
    <div className="container max-w-sm py-20 text-center space-y-6">
      <CheckCircle2 className="size-16 text-primary mx-auto" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome to {tierLabel}!</h1>
        <p className="text-muted-foreground text-sm">
          Your subscription is active. All premium features are unlocked — enjoy the upgrade.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button asChild>
          <Link href="/">Explore the feed</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/profile/${profile?.username}`}>View your profile</Link>
        </Button>
      </div>
    </div>
  )
}
