import { ArrowUpRight, Info } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/common/ChartTooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProjectionPoint } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

interface SavingsProjectionChartProps {
  projection: ProjectionPoint[]
  emergencyTarget: number
}

export function SavingsProjectionChart({ projection, emergencyTarget }: SavingsProjectionChartProps) {
  const current = projection[0]?.savings ?? 0
  const final = projection[projection.length - 1]?.savings ?? 0
  const growth = final - current
  const maxValue = Math.max(...projection.map((point) => point.savings), emergencyTarget, 1)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Your 12-month trajectory</h2>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-faint transition-colors hover:text-muted"
                    aria-label="About the savings projection"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  A deterministic projection using your current income, outgoings and savings. No investment returns are assumed.
                </TooltipContent>
              </UiTooltip>
            </div>
            <p className="mt-1 text-[11px] text-muted">If your income and spending stay on their current path</p>
          </div>
          <Badge variant="success">
            <ArrowUpRight className="h-3 w-3" />
            {formatCurrency(growth, { compact: true, sign: true })}
          </Badge>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
          <p className="numeric text-[30px] font-medium leading-none tracking-[-0.05em] text-ink sm:text-[34px]">
            {formatCurrency(final)}
          </p>
          <p className="pb-0.5 text-[11px] text-faint">projected in 12 months</p>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div
          className="h-[250px] w-full sm:h-[268px]"
          role="img"
          aria-label={`Savings projection rising from ${formatCurrency(current)} today to ${formatCurrency(final)} in twelve months`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#44DCA9" stopOpacity={0.22} />
                  <stop offset="85%" stopColor="#44DCA9" stopOpacity={0.015} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1B2A3D" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#697B92', fontSize: 10, fontFamily: 'Manrope Variable' }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                dy={8}
              />
              <YAxis
                domain={[0, Math.ceil((maxValue * 1.08) / 50000) * 50000]}
                tick={{ fill: '#697B92', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
                width={54}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#3D536E', strokeDasharray: '3 4' }}
              />
              <ReferenceLine
                y={emergencyTarget}
                stroke="#F3B65D"
                strokeDasharray="4 5"
                strokeOpacity={0.55}
                label={{
                  value: 'Emergency target',
                  position: 'insideBottomRight',
                  fill: '#9A8058',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                }}
              />
              <Area
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="#44DCA9"
                strokeWidth={2.2}
                fill="url(#savingsFill)"
                activeDot={{ r: 4, fill: '#44DCA9', stroke: '#07101A', strokeWidth: 2 }}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-4">
          <span className="flex items-center gap-2 text-[10px] text-muted">
            <span className="h-1.5 w-3 rounded-full bg-emerald-400" /> Projected savings
          </span>
          <span className="flex items-center gap-2 text-[10px] text-muted">
            <span className="h-px w-3 border-t border-dashed border-amber/70" /> Emergency target
          </span>
          <span className="ml-auto text-[9px] text-faint">Conservative · 0% assumed return</span>
        </div>
      </CardContent>
    </Card>
  )
}
