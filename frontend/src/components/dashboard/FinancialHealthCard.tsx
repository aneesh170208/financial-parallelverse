import { ArrowUpRight, Info, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CashflowBreakdown, Profile } from '@/types/api'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

interface FinancialHealthCardProps {
  profile: Profile
  cashflow: CashflowBreakdown
  insight: string
  monthlyCommitment: number
}

const scoreTone = (score: number) =>
  score >= 85 ? '#44DCA9' : score >= 70 ? '#6FC3EA' : score >= 50 ? '#F3B65D' : '#F47C8B'

export function FinancialHealthCard({
  profile,
  cashflow,
  insight,
  monthlyCommitment,
}: FinancialHealthCardProps) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - profile.health_score / 100)
  const tone = scoreTone(profile.health_score)
  const income = Math.max(cashflow.income, 1)
  const segments = [
    { label: 'Essentials', value: cashflow.essential, color: '#6FC3EA' },
    { label: 'Lifestyle', value: cashflow.discretionary, color: '#B49BFA' },
    { label: 'Debt', value: cashflow.debt, color: '#F3B65D' },
    { label: 'Free cash', value: Math.max(0, cashflow.free_cash_flow), color: '#44DCA9' },
  ]

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Financial weather</h2>
            <p className="mt-1 text-[11px] text-muted">A holistic read on your resilience</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-faint hover:text-muted" aria-label="How the health score works">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Weighted across savings rate, emergency cover, debt load and monthly free cash flow.
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-3">
        <div className="flex items-center gap-4">
          <div className="relative h-[132px] w-[132px] shrink-0">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#1A293C" strokeWidth="8" />
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={tone}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="numeric text-[28px] font-medium leading-none tracking-[-0.05em] text-ink">
                {profile.health_score}
              </span>
              <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-faint">out of 100</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
              <p className="text-[13px] font-semibold" style={{ color: tone }}>{profile.health_label}</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {formatPercent(profile.savings_rate_pct)} savings rate · {profile.emergency_coverage_months.toFixed(1)} months covered
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-faint">
              {formatCurrency(monthlyCommitment)} in tracked installments each month
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
          <p className="line-clamp-3 text-[11px] leading-relaxed text-muted">{insight}</p>
        </div>

        <div className="mt-auto pt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">Where each rupee goes</p>
            <span className="text-[9px] text-faint">of ₹{Math.round(income / 1000)}k income</span>
          </div>
          <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Monthly cash-flow allocation">
            {segments.map((segment) => (
              <span
                key={segment.label}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', segment.value <= 0 && 'hidden')}
                style={{ width: `${(segment.value / income) * 100}%`, backgroundColor: segment.color }}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="numeric shrink-0 text-[10px] text-ink">{formatCurrency(segment.value, { compact: true })}</span>
              </div>
            ))}
          </div>
          <Link
            to="/profile"
            className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Tune your assumptions <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
