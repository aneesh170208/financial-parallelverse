import { ArrowRight, Lightbulb, PiggyBank } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PurchaseAssessment } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

export function PlanBlueprint({
  assessment,
  onSave,
  saving,
}: {
  assessment: PurchaseAssessment
  onSave: () => void
  saving: boolean
}) {
  return (
    <Card>
      <CardHeader className="border-b border-line/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber/15 bg-amber/[0.06] text-amber">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <CardTitle>Your plan, step by step</CardTitle>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              Small, concrete moves that make the decision safer.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onSave} loading={saving}>
            <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
            Save this plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {assessment.recommendations.map((recommendation, index) => (
            <div
              key={recommendation}
              className="flex gap-3 rounded-xl border border-line/70 bg-[#09121E]/55 p-3.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.025] font-mono text-[9px] text-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-[10.5px] leading-relaxed text-muted">{recommendation}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
          <p className="text-[9px] text-faint">
            Recommended monthly set-aside:{' '}
            <span className="numeric text-muted">{formatCurrency(assessment.recommended_monthly_saving)}</span>
            {' '}· Target: <span className="numeric text-muted">{formatCurrency(assessment.amount)}</span>
          </p>
          <span className="flex items-center gap-1 text-[9px] text-emerald-300/80">
            Emergency reserve stays protected <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
