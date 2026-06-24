'use client'

import { Zap, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { TIER_NAMES } from '@/lib/subscription/tiers'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  currentTierName?: string
}

export function UpgradeModal({
  open,
  onClose,
  title,
  description = 'Upgrade your plan to access this feature and unlock premium visibility across BIZI.',
  currentTierName = TIER_NAMES.free,
}: Props) {
  const router = useRouter()
  const targetName = TIER_NAMES.pro

  function handleUpgrade() {
    onClose()
    router.push(`/upgrade?tier=pro&billing=annual`)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="size-6" />
          </span>
          <DialogTitle>{title ?? `Unlock with ${targetName}`}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Current → target plan indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {currentTierName}
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <span className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {targetName}
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button className="w-full" onClick={handleUpgrade}>
            Upgrade to {targetName} →
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { onClose(); router.push('/pricing') }}>
            See all plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
