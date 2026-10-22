import {
  ArrowUpRight,
  CloudLightning,
  CreditCard,
  Feather,
  Hourglass,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

import { RiskBadge } from '@/components/common/RiskBadge'
import type { Scenario } from '@/types/api'
import { cn, formatCurrency } from '@/lib/utils'

const icons = {
  buy_now: ShoppingBag,
  wait_and_save: Hourglass,
  lighter: Feather,
  emi: CreditCard,
  curveball: CloudLightning,
  baseline: Sparkles,
}

interface ScenarioCardProps {
  scenario: Scenario
  recommended: boolean
  onView: (scenario: Scenario) => void
}

export function ScenarioCard({ scenario, recommended, onView }: ScenarioCardProps) {
  const Icon = icons[scenario.id as keyof typeof icons] ?? Sparkles
  const bufferGap = scenario.emergency_shortfall > 0

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-surface/90 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift',
        recommended ? 'border-emerald-400/35' : 'border-line/80 hover:border-[#33485f]',
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-[2px] opacity-80"
        style={{ backgroundColor: scenario.color }}
      />
      <button
        type="button"
        onClick={() => onView(scenario)}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-inset"
        aria-label={`View the full path for ${scenario.name}`}
      />

      <div className="pointer-events-none relative flex flex-1 flex-col p-4 sm:p-[18px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[10px] border"
              style={{
                color: scenario.color,
                borderColor: `${scenario.color}30`,
                backgroundColor: `${scenario.color}12`,
              }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={1.8} />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">{scenario.tagline}</span>
          </div>
          {recommended ? (
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/[0.1] px-2 py-0.5 font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-emerald-300">
              <Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> Best fit
            </span>
          ) : (
            <RiskBadge risk={scenario.risk} label={scenario.risk_label} />
          )}
        </div>

        <h3 className="mt-3.5 text-[15px] font-semibold tracking-[-0.02em] text-ink">{scenario.name}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[10.5px] leading-relaxed text-muted">{scenario.description}</p>

        <div className="mt-3.5 rounded-lg border border-white/[0.045] bg-[#09121E]/60 px-3 py-2.5">
          <p className="line-clamp-2 text-[10px] leading-relaxed text-muted/90">{scenario.verdict}</p>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-line/60 pt-3.5">
          <div>
            <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Ending savings</p>
            <p className="numeric mt-1 text-[13px] font-medium text-ink">{formatCurrency(scenario.final_savings)}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Lowest reserve</p>
            <p className="numeric mt-1 text-[13px] font-medium text-ink">{formatCurrency(scenario.minimum_savings)}</p>
          </div>
        </div>

        <div className="mt-3 flex min-h-[18px] flex-wrap items-center justify-between gap-2">
          {bufferGap ? (
            <span className="rounded-full border border-amber/20 bg-amber/[0.07] px-2 py-0.5 text-[8px] font-medium text-amber">
              {formatCurrency(scenario.emergency_shortfall)} buffer gap
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-medium text-emerald-300/80">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Reserve protected
            </span>
          )}
          {scenario.interest_paid > 0 && (
            <span className="text-[8px] text-faint">{formatCurrency(scenario.interest_paid)} interest</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line/50 pt-2.5">
          <span className="text-[9px] font-medium text-faint transition-colors group-hover:text-muted">
            Inspect this future
          </span>
          <ArrowUpRight
            className="h-3.5 w-3.5 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-300"
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  )
}
