import { ArrowRight, CalendarDays, LaptopMinimal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { PurchaseSnapshot } from '@/types/api'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'

export function NextDecisionCard({ purchase, currentSavings }: { purchase: PurchaseSnapshot; currentSavings: number }) {
  const ready = purchase.readiness_pct >= 100
  const monthsLabel =
    purchase.months_to_purchase === 0
      ? 'Ready now'
      : purchase.months_to_purchase === null
        ? 'Cash flow needs attention'
        : `About ${purchase.months_to_purchase} month${purchase.months_to_purchase === 1 ? '' : 's'} away`

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[46%] surface-grid opacity-60" />
      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full border border-emerald-400/[0.08]" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border border-emerald-400/[0.07]" />
      <div className="relative flex h-full flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Your next decision</p>
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-[#09121E]/80 px-2.5 py-1 text-[9px] font-medium text-muted">
              <CalendarDays className="h-3 w-3 text-faint" aria-hidden="true" />
              {formatDate(purchase.target_date, 'medium')}
            </span>
          </div>

          <div className="mt-5 flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated/80 text-sand">
              <LaptopMinimal className="h-5 w-5" aria-hidden="true" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.025em] text-ink">{purchase.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                <span className="numeric text-[25px] font-medium tracking-[-0.045em] text-ink">
                  {formatCurrency(purchase.amount)}
                </span>
                <span className="text-[10px] text-faint">planned purchase</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-[10px]">
              <span className="text-muted">Safely available today</span>
              <span className="numeric text-ink">
                {formatCurrency(purchase.safe_to_spend)}{' '}
                <span className="text-faint">of {formatCurrency(purchase.amount)}</span>
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.055]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-500"
                style={{ width: `${Math.min(100, purchase.readiness_pct)}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <span className="text-faint">{formatPercent(purchase.readiness_pct)} inside your safety buffer</span>
              <span className={ready ? 'text-emerald-300' : 'text-amber'}>{monthsLabel}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-faint">Buffer gap</p>
              <p className="numeric mt-1 text-[13px] text-ink">{formatCurrency(purchase.gap)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-faint">Target window</p>
              <p className="numeric mt-1 text-[13px] text-ink">
                {purchase.days_until_target >= 0 ? `${purchase.days_until_target} days` : 'Date passed'}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.1em] text-faint">Current savings</p>
              <p className="numeric mt-1 text-[13px] text-ink">{formatCurrency(currentSavings)}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col justify-between gap-4 rounded-xl border border-line/70 bg-[#09121E]/70 p-4 lg:w-[208px]">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-[12px] font-semibold leading-snug text-ink">
              One purchase. Five possible futures.
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
              Compare buying now, waiting, a lighter option and EMI before you commit.
            </p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link to="/futures">
              Explore futures <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
