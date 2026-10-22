import { ArrowUpRight, Clock3, GitFork } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { RecentSimulation } from '@/types/api'
import { formatCurrency, relativeTime } from '@/lib/utils'

export function RecentAnalysis({ simulation }: { simulation: RecentSimulation | null }) {
  if (!simulation) {
    return (
      <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-[#09121E] text-faint">
            <GitFork className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Parallel futures</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">No scenarios explored yet</p>
          </div>
        </div>
        <Link to="/futures" className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
          Run your first simulation <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </Card>
    )
  }
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet/15 bg-violet/[0.06] text-violet">
            <GitFork className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Latest parallel future</p>
              <Badge variant="success">Best fit · {simulation.recommended_scenario}</Badge>
            </div>
            <p className="mt-1 truncate text-[13px] font-semibold text-ink">{simulation.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-faint">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {relativeTime(simulation.created_at)}
              <span>·</span>
              {formatCurrency(simulation.purchase_amount)} purchase
            </p>
          </div>
        </div>
        <Link
          to="/futures"
          className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          Open the analysis <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
