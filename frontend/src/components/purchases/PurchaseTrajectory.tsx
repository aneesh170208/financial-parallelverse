import { Flag, Route } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/common/ChartTooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { PurchaseAssessment } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export function PurchaseTrajectory({ assessment }: { assessment: PurchaseAssessment }) {
  const goal = Math.max(assessment.amount, 1)
  const endValue = assessment.trajectory[assessment.trajectory.length - 1]?.available_for_purchase ?? 0
  const max = Math.max(goal, endValue)
  const statusVariant = assessment.on_track ? 'success' : 'warning'
  const label = assessment.status === 'ready' ? 'Ready now' : assessment.on_track ? 'Target in reach' : 'Date needs adjusting'

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-line/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-[#09121E] text-sky">
                <Route className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Path to purchase</h2>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              How your safe-to-spend amount grows if you set aside free cash flow each month.
            </p>
          </div>
          <Badge variant={statusVariant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.1em] text-faint">Ready by estimate</p>
            <p className="numeric mt-1 text-[20px] font-medium tracking-[-0.04em] text-ink">
              {assessment.estimated_affordable_date
                ? formatDate(assessment.estimated_affordable_date, 'monthYear')
                : 'Cash flow blocked'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.1em] text-faint">Target date</p>
            <p className="numeric mt-1 text-[13px] text-muted">{formatDate(assessment.target_date, 'medium')}</p>
          </div>
        </div>
        <div
          className="h-[240px] w-full"
          role="img"
          aria-label={`Projected safe-to-spend savings path against a ${formatCurrency(assessment.amount)} goal`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={assessment.trajectory} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6FC3EA" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#6FC3EA" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1B2A3D" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#697B92', fontSize: 10, fontFamily: 'Manrope Variable' }}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
                dy={8}
              />
              <YAxis
                domain={[0, Math.ceil((max * 1.1) / 10000) * 10000]}
                tick={{ fill: '#697B92', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
                width={56}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#3D536E', strokeDasharray: '3 4' }}
              />
              <ReferenceLine
                y={assessment.amount}
                stroke="#44DCA9"
                strokeDasharray="5 4"
                label={{
                  value: 'Purchase goal',
                  position: 'insideTopRight',
                  fill: '#6F8B82',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                }}
              />
              <Area
                type="monotone"
                dataKey="available_for_purchase"
                name="Safe to spend"
                stroke="#6FC3EA"
                strokeWidth={2.2}
                fill="url(#goalFill)"
                activeDot={{ r: 4, fill: '#6FC3EA', stroke: '#07101A', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-4">
          <span className="flex items-center gap-2 text-[10px] text-muted">
            <span className="h-1.5 w-3 rounded-full bg-sky" /> Safe-to-spend savings
          </span>
          <span className="flex items-center gap-2 text-[10px] text-muted">
            <span className="h-px w-3 border-t border-dashed border-emerald-400" /> Purchase goal
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[9px] text-faint">
            <Flag className="h-3 w-3" aria-hidden="true" /> {assessment.months_until_target} months until target
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
