import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AssessmentStatus, PurchaseAssessment } from '@/types/api'
import { cn, formatCurrency, formatDate, formatPercent } from '@/lib/utils'

const statusConfig: Record<
  AssessmentStatus,
  { label: string; variant: 'success' | 'info' | 'warning' | 'danger'; color: string; bar: string }
> = {
  ready: { label: 'Ready with buffer', variant: 'success', color: 'text-emerald-300', bar: 'from-[#167C5C] to-[#44DCA9]' },
  on_track: { label: 'On track', variant: 'info', color: 'text-sky', bar: 'from-[#2C6B89] to-[#6FC3EA]' },
  needs_adjustment: { label: 'Needs adjustment', variant: 'warning', color: 'text-amber', bar: 'from-[#85642D] to-[#F3B65D]' },
  blocked: { label: 'Pause first', variant: 'danger', color: 'text-rose', bar: 'from-[#803C48] to-[#F47C8B]' },
}

interface ReadinessCardProps {
  assessment: PurchaseAssessment
  activePlanTitle?: string | null
  saving: boolean
  onSave: () => void
  onTryAlternative: (amount: number) => void
}

export function ReadinessCard({ assessment, activePlanTitle, saving, onSave, onTryAlternative }: ReadinessCardProps) {
  const status = statusConfig[assessment.status]
  const alternativeUseful =
    assessment.suggested_alternative > 0 && assessment.suggested_alternative < assessment.amount * 0.99

  return (
    <Card className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 surface-grid opacity-40" />
      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Purchase readiness</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-semibold tracking-[-0.025em] text-ink">{assessment.title}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
              {activePlanTitle && <Badge variant="outline">Saved plan</Badge>}
            </div>
            <p className="mt-1 text-[11px] text-faint">
              {formatCurrency(assessment.amount)} by {formatDate(assessment.target_date, 'long')}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-[#09121E]/80 px-3 py-2">
            <CalendarClock className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
            <span className="text-[9px] text-faint">
              {assessment.months_until_target} month{assessment.months_until_target === 1 ? '' : 's'} away
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-2">
          <p className={cn('numeric text-[44px] font-medium leading-none tracking-[-0.06em]', status.color)}>
            {formatPercent(assessment.readiness_pct)}
          </p>
          <div className="pb-1">
            <p className="text-[11px] font-medium text-ink">of the target is safely available</p>
            <p className="mt-0.5 text-[10px] text-faint">
              {formatCurrency(assessment.available_today)} of {formatCurrency(assessment.amount)} inside your reserve limit
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', status.bar)}
              style={{ width: `${Math.min(100, assessment.readiness_pct)}%` }}
            />
            <span className="absolute inset-y-0 left-[75%] w-px bg-white/15" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-faint">
            <span>Today</span>
            <span>{formatPercent(100)} protected</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line/70 bg-[#09121E]/55 p-4">
          <p className="text-[13px] font-semibold leading-snug text-ink">{assessment.headline}</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">{assessment.summary}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/70 bg-line/60 sm:grid-cols-4">
          <Metric label="Safe today" value={formatCurrency(assessment.safe_to_spend)} />
          <Metric label="Gap to close" value={formatCurrency(assessment.gap)} />
          <Metric
            label="At this pace"
            value={
              assessment.months_to_goal === null
                ? 'No pace yet'
                : assessment.months_to_goal === 0
                  ? 'Ready now'
                  : `${assessment.months_to_goal} mo`
            }
          />
          <Metric label="Monthly needed" value={formatCurrency(assessment.monthly_saving_needed)} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button onClick={onSave} loading={saving}>
            {activePlanTitle ? 'Update saved plan' : 'Save this plan'}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button asChild variant="secondary">
            <Link to="/futures">
              Compare futures
              <ChartNoAxesCombined className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          {activePlanTitle && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-300/80">
              <CircleCheck className="h-3 w-3" aria-hidden="true" /> active plan
            </span>
          )}
        </div>

        {alternativeUseful && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <TriangleAlert className="h-3.5 w-3.5 text-amber" aria-hidden="true" />
            <span className="text-[10px] text-muted">
              A lighter budget of {formatCurrency(assessment.suggested_alternative)} could shorten the runway.
            </span>
            <button
              type="button"
              onClick={() => onTryAlternative(assessment.suggested_alternative)}
              className="text-[10px] font-semibold text-amber underline decoration-amber/30 underline-offset-4 hover:text-amber/80"
            >
              Try it instead
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0B1523] px-3 py-2.5">
      <p className="text-[8px] uppercase tracking-[0.1em] text-faint">{label}</p>
      <p className="numeric mt-1 text-[11px] font-medium text-ink">{value}</p>
    </div>
  )
}
