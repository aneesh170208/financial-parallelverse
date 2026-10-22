import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Recommendation, Scenario } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

export function RecommendationBanner({
  recommendation,
  scenario,
}: {
  recommendation: Recommendation
  scenario: Scenario | undefined
}) {
  return (
    <Card className="relative overflow-hidden border-emerald-400/25 bg-[linear-gradient(120deg,rgba(24,169,122,0.10),rgba(12,21,35,0.7)_46%,rgba(12,21,35,0.9))]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] surface-grid opacity-40" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-emerald-400/[0.12]" />
      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-emerald-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Most resilient route
            </span>
            {scenario && (
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
                {scenario.risk_label} · {scenario.emergency_shortfall <= 0 ? 'Buffer preserved' : 'Buffer stretched'}
              </span>
            )}
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-[-0.03em] text-ink sm:text-[21px]">
            {recommendation.headline}
          </h2>
          <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-muted">{recommendation.rationale}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 border-emerald-400/15 sm:flex-row sm:items-center lg:border-l lg:pl-6">
          <div>
            <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Safe to spend now</p>
            <p className="numeric mt-1 text-[16px] font-medium text-ink">{formatCurrency(recommendation.safe_to_spend_now)}</p>
            <p className="mt-1 flex items-center gap-1 text-[8px] text-emerald-300/80">
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" /> emergency fund protected
            </p>
          </div>
          <Button asChild size="sm" className="sm:ml-2">
            <Link to="/planner">
              Plan this route <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
