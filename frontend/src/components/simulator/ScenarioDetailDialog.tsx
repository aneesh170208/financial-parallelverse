import { ArrowRight, CalendarDays, CircleDollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

import { RiskBadge } from '@/components/common/RiskBadge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Scenario } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

function MiniPath({ scenario }: { scenario: Scenario }) {
  const width = 520
  const height = 110
  const points = scenario.path
  const values = points.map((point) => point.savings)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const coords = points
    .map((point, index) => {
      const x = points.length > 1 ? (index / (points.length - 1)) * width : 0
      const y = height - ((point.savings - min) / range) * (height - 12) - 6
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-xl border border-line/70 bg-[#09121E] p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[100px] w-full"
        role="img"
        aria-label={`${scenario.name} savings path from ${formatCurrency(points[0]?.savings ?? 0)} to ${formatCurrency(scenario.final_savings)}`}
      >
        <defs>
          <linearGradient id={`mini-fill-${scenario.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={scenario.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={scenario.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,${height} ${coords} ${width},${height}`} fill={`url(#mini-fill-${scenario.id})`} stroke="none" />
        <polyline
          points={coords}
          fill="none"
          stroke={scenario.color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between px-1 text-[9px] text-faint">
        <span>Now</span>
        <span>{points[0]?.label} → {points[points.length - 1]?.label}</span>
        <span>{scenario.path[scenario.path.length - 1]?.date.slice(0, 4)}</span>
      </div>
    </div>
  )
}

export function ScenarioDetailDialog({
  scenario,
  onClose,
}: {
  scenario: Scenario | null
  onClose: () => void
}) {
  if (!scenario) {
    return null
  }

  const metrics = [
    { label: 'Ending savings', value: formatCurrency(scenario.final_savings) },
    { label: 'Lowest reserve point', value: formatCurrency(scenario.minimum_savings) },
    {
      label: scenario.emergency_shortfall > 0 ? 'Buffer gap' : 'Reserve coverage',
      value:
        scenario.emergency_shortfall > 0
          ? formatCurrency(scenario.emergency_shortfall)
          : `${scenario.months_of_cover.toFixed(1)} months`,
    },
    {
      label: scenario.monthly_commitment > 0 ? 'Monthly commitment' : 'Total outflow',
      value:
        scenario.monthly_commitment > 0
          ? `${formatCurrency(scenario.monthly_commitment)}/mo`
          : formatCurrency(scenario.total_outflow),
    },
  ]

  return (
    <Dialog open={!!scenario} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]"
              style={{ color: scenario.color, borderColor: `${scenario.color}35`, backgroundColor: `${scenario.color}12` }}
            >
              {scenario.tagline}
            </span>
            <RiskBadge risk={scenario.risk} label={scenario.risk_label} />
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Score {scenario.score}/100</span>
          </div>
          <DialogTitle className="text-lg">{scenario.name}</DialogTitle>
          <DialogDescription>{scenario.description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <MiniPath scenario={scenario} />

          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] px-4 py-3">
            <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-300">What this means</p>
            <p className="text-[11px] leading-relaxed text-muted">{scenario.verdict}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
                <p className="text-[8px] uppercase tracking-[0.1em] text-faint">{metric.label}</p>
                <p className="numeric mt-1.5 text-[14px] font-medium text-ink">{metric.value}</p>
              </div>
            ))}
          </div>

          {scenario.purchase_events.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                <CalendarDays className="h-3.5 w-3.5 text-faint" aria-hidden="true" /> Money movement
              </p>
              <div className="divide-y divide-line/60 rounded-xl border border-line/70">
                {scenario.purchase_events.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-[10px] text-ink">{event.type}</p>
                      <p className="mt-0.5 text-[9px] text-faint">{event.month === 0 ? 'Today' : event.label}</p>
                    </div>
                    <p className="numeric text-[11px] text-muted">−{formatCurrency(event.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 rounded-xl border border-line/70 bg-white/[0.018] p-3.5">
            <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            <div className="text-[9.5px] leading-relaxed text-faint">
              <p className="mb-1 font-medium text-muted">What this path assumes</p>
              <p>
                No investment return is credited. Month-end balances are shown after all income, spending and
                purchase outflows. The protected emergency fund is never counted as spendable.
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button asChild>
            <Link to="/planner">
              Build a plan around this <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
