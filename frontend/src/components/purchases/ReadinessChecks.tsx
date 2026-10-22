import { Check, CircleAlert, Minus, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthFactorStatus, PurchaseAssessment } from '@/types/api'
import { cn } from '@/lib/utils'

const statusStyles: Record<HealthFactorStatus, { icon: typeof Check; className: string }> = {
  good: { icon: Check, className: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300' },
  watch: { icon: Minus, className: 'border-amber/20 bg-amber/[0.08] text-amber' },
  risk: { icon: CircleAlert, className: 'border-rose/20 bg-rose/[0.08] text-rose' },
}

export function ReadinessChecks({ assessment }: { assessment: PurchaseAssessment }) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line/60 pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="h-4 w-4 text-faint" aria-hidden="true" />
          Readiness checks
        </CardTitle>
        <p className="mt-1 text-[11px] text-muted">The fundamentals behind this assessment.</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-1">
          {assessment.factors.map((factor) => {
            const style = statusStyles[factor.status]
            const Icon = style.icon
            return (
              <div key={factor.key} className="flex items-start gap-3 rounded-lg px-1 py-2.5">
                <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border', style.className)}>
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-ink">{factor.label}</p>
                    <p className="numeric text-[10px] text-muted">{factor.value}</p>
                  </div>
                  <p className="mt-0.5 text-[9px] text-faint">{factor.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 rounded-lg border border-line/70 bg-[#09121E]/60 px-3 py-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">First move</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">{assessment.recommended_first_step}</p>
        </div>
        <Link to="/profile" className="mt-4 inline-block text-[10px] font-semibold text-emerald-300 hover:text-emerald-200">
          Change your fundamentals in Profile →
        </Link>
      </CardContent>
    </Card>
  )
}
