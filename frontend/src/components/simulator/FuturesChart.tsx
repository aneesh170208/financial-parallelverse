import { Info, LineChart as LineChartIcon, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip } from '@/components/common/ChartTooltip'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Scenario } from '@/types/api'
import { cn, formatCurrency } from '@/lib/utils'

type ChartMetric = 'savings' | 'cash_flow'

interface FuturesChartProps {
  scenarios: Scenario[]
  emergencyTarget: number
  recommendedId: string
}

export function FuturesChart({ scenarios, emergencyTarget, recommendedId }: FuturesChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('savings')
  const [visible, setVisible] = useState<string[]>(() => scenarios.map((scenario) => scenario.id))

  const merged = useMemo(
    () =>
      (scenarios[0]?.path ?? []).map((point, index) => {
        const row: Record<string, string | number> = { label: point.label, date: point.date }
        scenarios.forEach((scenario) => {
          const scenarioPoint = scenario.path[index]
          row[`${scenario.id}_savings`] = scenarioPoint?.savings ?? 0
          row[`${scenario.id}_cash_flow`] = scenarioPoint?.cash_flow ?? 0
        })
        return row
      }),
    [scenarios],
  )

  const values = useMemo(() => {
    if (!visible.length) return [0, 1]
    const series = scenarios
      .filter((scenario) => visible.includes(scenario.id))
      .map((scenario) =>
        scenario.path.map((point) => (metric === 'savings' ? point.savings : point.cash_flow)),
      )
      .flat()
    const min = Math.min(0, ...series)
    const max = Math.max(...series, emergencyTarget, 1)
    const paddedMax = max * 1.08
    const paddedMin = min < 0 ? min * 1.1 : 0
    return [paddedMin, paddedMax]
  }, [emergencyTarget, metric, scenarios, visible])

  const toggleScenario = (id: string) => {
    setVisible((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((item) => item !== id)
      }
      return [...current, id]
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b border-line/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-[#09121E] text-emerald-300">
                <LineChartIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Parallel paths</h2>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">
              {metric === 'savings'
                ? 'Month-end savings for every route. The dashed line is your protected buffer.'
                : 'Net monthly cash flow. Negative months mean money is moving out faster than in.'}
            </p>
          </div>
          <SegmentedControl
            value={metric}
            onChange={setMetric}
            ariaLabel="Choose chart metric"
            options={[
              { value: 'savings', label: 'Savings', icon: Wallet },
              { value: 'cash_flow', label: 'Cash flow', icon: LineChartIcon },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-[9px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Best fit: {scenarios.find((scenario) => scenario.id === recommendedId)?.short_name ?? '—'}
          </span>
          <span className="text-[9px] text-faint">·</span>
          <span className="flex items-center gap-1 text-[9px] text-faint">
            Emergency target {formatCurrency(emergencyTarget, { compact: true })}
            <UiTooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="About the emergency target line" className="text-faint/70 hover:text-muted">
                  <Info className="h-2.5 w-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Your emergency fund target. The planner avoids spending below it.</TooltipContent>
            </UiTooltip>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div
          className="h-[310px] w-full sm:h-[350px]"
          role="img"
          aria-label={`Line chart comparing ${scenarios.length} financial futures by ${metric.replace('_', ' ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
                domain={values as [number, number]}
                tick={{ fill: '#697B92', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                width={58}
                tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#3D536E', strokeDasharray: '3 4' }} />
              {metric === 'cash_flow' ? (
                <ReferenceLine y={0} stroke="#43566E" strokeWidth={1} />
              ) : (
                <ReferenceLine
                  y={emergencyTarget}
                  stroke="#F3B65D"
                  strokeOpacity={0.65}
                  strokeDasharray="4 5"
                />
              )}
              {scenarios.map((scenario) => (
                <Line
                  key={scenario.id}
                  type="monotone"
                  dataKey={`${scenario.id}_${metric}`}
                  name={scenario.short_name}
                  stroke={scenario.color}
                  strokeWidth={scenario.id === recommendedId ? 2.5 : 1.8}
                  strokeDasharray={scenario.is_baseline ? '5 5' : undefined}
                  strokeOpacity={visible.includes(scenario.id) ? 1 : 0}
                  dot={false}
                  activeDot={visible.includes(scenario.id) ? { r: 3.5, strokeWidth: 2, stroke: '#08111D' } : false}
                  animationDuration={600}
                  hide={!visible.includes(scenario.id)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line/60 pt-4" aria-label="Toggle scenarios on the chart">
          {scenarios.map((scenario) => {
            const active = visible.includes(scenario.id)
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => toggleScenario(scenario.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all',
                  active
                    ? 'border-line bg-white/[0.035] text-ink'
                    : 'border-transparent bg-transparent text-faint opacity-55 hover:opacity-90',
                )}
              >
                <span
                  className={cn('h-[3px] w-3.5 rounded-full transition-opacity', !active && 'opacity-40')}
                  style={{ backgroundColor: scenario.color }}
                />
                {scenario.short_name}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[9px] text-faint/80">
          Includes the no-purchase baseline for reference. Toggle any path to isolate it.
        </p>
      </CardContent>
    </Card>
  )
}
