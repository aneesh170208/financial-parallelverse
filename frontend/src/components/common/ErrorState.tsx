import { RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-rose/20 bg-rose/[0.04] px-6 py-12 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-rose/20 bg-rose/[0.08]">
        <TriangleAlert className="h-5 w-5 text-rose" aria-hidden="true" />
      </div>
      <h2 className="text-sm font-semibold text-ink">We could not load this view</h2>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}
