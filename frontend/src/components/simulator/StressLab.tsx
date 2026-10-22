import { Clock4, CloudLightning, FileQuestion, SlidersHorizontal, TrendingUp } from 'lucide-react'

import { RiskBadge } from '@/components/common/RiskBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { SimulationAssumptions, StressTest } from '@/types/api'
import { cn, formatCurrency } from '@/lib/utils'

const icons: Record<string, typeof FileQuestion> = {
  unexpected_expense: FileQuestion,
  salary_delay: Clock4,
  spending_increase: TrendingUp,
  combined_adverse: CloudLightning,
}

export function StressLab({
  tests,
  assumptions,
  onEdit,
}: {
  tests: StressTest[]
  assumptions: SimulationAssumptions
  onEdit: () => void
}) {
  const baseline = tests.find((test) => test.id === 'stress_baseline')
  const adverse = tests.filter((test) => test.id !== 'stress_baseline')

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-line/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose/15 bg-rose/[0.06] text-rose">
                <CloudLightning className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Stress lab</h2>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              What could go wrong after you buy? These futures apply the shocks to the buy-now route.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Edit stress inputs
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-line/70 bg-[#09121E] px-2 py-1 text-[9px] text-faint">
            {formatCurrency(assumptions.unexpected_expense_amount, { compact: true })} surprise in month{' '}
            {assumptions.unexpected_expense_month}
          </span>
          <span className="rounded-md border border-line/70 bg-[#09121E] px-2 py-1 text-[9px] text-faint">
            Salary delayed {assumptions.delayed_salary_months} month{assumptions.delayed_salary_months === 1 ? '' : 's'}
          </span>
          <span className="rounded-md border border-line/70 bg-[#09121E] px-2 py-1 text-[9px] text-faint">
            +{assumptions.spending_increase_pct}% monthly spend
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {baseline && (
          <div className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/[0.1] text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-ink">No surprises</p>
                  <p className="mt-0.5 text-[9.5px] text-faint">Buy now with stable income and spending.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Ending savings</p>
                  <p className="numeric mt-0.5 text-[12px] text-ink">{formatCurrency(baseline.final_savings)}</p>
                </div>
                <RiskBadge risk={baseline.risk} label={baseline.risk_label} />
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {adverse.map((test) => {
            const Icon = icons[test.id] ?? FileQuestion
            const ratio = baseline && baseline.final_savings > 0
              ? Math.max(0, (test.final_savings / baseline.final_savings) * 100)
              : 0
            const barColor =
              test.risk === 'critical'
                ? '#F47C8B'
                : test.risk === 'fragile'
                  ? '#F3B65D'
                  : test.risk === 'steady'
                    ? '#6FC3EA'
                    : '#44DCA9'
            return (
              <div key={test.id} className="rounded-xl border border-line/70 bg-[#09121E]/55 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                    <p className="truncate text-[11px] font-semibold text-ink">{test.name}</p>
                  </div>
                  <RiskBadge risk={test.risk} label={test.risk_label} />
                </div>
                <p className="mt-1.5 min-h-[28px] text-[9.5px] leading-relaxed text-faint">{test.description}</p>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Ending savings</p>
                    <p className="numeric mt-1 text-[13px] font-medium text-ink">{formatCurrency(test.final_savings)}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-1 font-mono text-[9px]',
                      test.impact_vs_no_surprises < 0 ? 'bg-rose/[0.08] text-rose' : 'bg-emerald-400/[0.07] text-emerald-300',
                    )}
                  >
                    {test.impact_vs_no_surprises < 0
                      ? formatCurrency(test.impact_vs_no_surprises, { compact: true })
                      : test.impact_vs_no_surprises > 0
                        ? formatCurrency(test.impact_vs_no_surprises, { compact: true, sign: true })
                        : 'no change'}
                  </span>
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio)}%`, backgroundColor: barColor }} />
                </div>
                {test.emergency_shortfall > 0 && (
                  <p className="mt-2 text-[8px] text-amber">
                    Reserve gap at lowest point: {formatCurrency(test.emergency_shortfall)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
