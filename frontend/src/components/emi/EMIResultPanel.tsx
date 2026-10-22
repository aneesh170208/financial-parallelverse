import { AlertTriangle, BookmarkPlus, CheckCircle2, ChevronDown, Info, Landmark, ShieldAlert } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip } from '@/components/common/ChartTooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { EMIResult } from '@/types/api'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

interface EMIResultPanelProps {
  result: EMIResult
  purchasePrice: number
  downPayment: number
  updating: boolean
  onSave: () => void
}

const affordabilityStyles = {
  comfortable: {
    variant: 'success' as const,
    icon: CheckCircle2,
    wrapper: 'border-emerald-400/15 bg-emerald-400/[0.045]',
    iconClass: 'text-emerald-300',
  },
  cautious: {
    variant: 'warning' as const,
    icon: Info,
    wrapper: 'border-amber/15 bg-amber/[0.045]',
    iconClass: 'text-amber',
  },
  stretched: {
    variant: 'warning' as const,
    icon: AlertTriangle,
    wrapper: 'border-amber/20 bg-amber/[0.055]',
    iconClass: 'text-amber',
  },
  unaffordable: {
    variant: 'danger' as const,
    icon: ShieldAlert,
    wrapper: 'border-rose/20 bg-rose/[0.055]',
    iconClass: 'text-rose',
  },
}

export function EMIResultPanel({ result, purchasePrice, downPayment, updating, onSave }: EMIResultPanelProps) {
  const totalExtras = result.total_interest + result.processing_fee
  const donutData = [
    { name: 'Principal', value: result.principal, color: '#44DCA9' },
    { name: 'Interest', value: result.total_interest, color: '#B49BFA' },
    { name: 'Fees', value: result.processing_fee, color: '#F3B65D' },
  ].filter((item) => item.value > 0)
  const affordability = result.affordability
  const style = affordability
    ? affordabilityStyles[affordability.status]
    : affordabilityStyles.cautious
  const StatusIcon = style.icon

  return (
    <div className={cn('space-y-4 transition-opacity', updating && 'opacity-75')} aria-busy={updating}>
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-violet/[0.035] blur-3xl" />
        <CardHeader className="gap-3 border-b border-line/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Monthly commitment</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <p className="numeric text-[38px] font-medium leading-none tracking-[-0.06em] text-ink sm:text-[44px]">
                  {formatCurrency(result.monthly_emi, { decimals: true })}
                </p>
                <span className="pb-1 text-[11px] text-faint">/ month</span>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                For {result.tenure_months} months at {result.annual_rate_pct}% p.a. ·{' '}
                {formatCurrency(result.principal)} financed
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {affordability && (
                <Badge variant={style.variant}>
                  <StatusIcon className="h-3 w-3" aria-hidden="true" />
                  {affordability.label}
                </Badge>
              )}
              <span className={cn('rounded-full border border-line bg-[#09121E] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em]', updating ? 'text-emerald-300' : 'text-faint')}>
                {updating ? 'Updating…' : 'Calculation current'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_210px]">
            <div>
              <div className="grid grid-cols-2 gap-3">
                <Fact label="Purchase price" value={formatCurrency(purchasePrice)} />
                <Fact label="Down payment" value={formatCurrency(downPayment)} />
                <Fact label="Total interest" value={formatCurrency(result.total_interest)} />
                <Fact label="Fees" value={formatCurrency(result.processing_fee)} />
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-line/60 bg-[#09121E]/60 px-3 py-2.5">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-faint" aria-hidden="true" />
                <p className="text-[9px] leading-relaxed text-faint">
                  You repay <span className="text-muted">{formatCurrency(result.total_cost)}</span> in total —{' '}
                  <span className="text-muted">{formatCurrency(totalExtras)}</span> more than the financed amount.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div
                className="relative h-[150px] w-full"
                role="img"
                aria-label={`Total cost breakdown: principal ${formatCurrency(result.principal)}, interest ${formatCurrency(result.total_interest)}, fees ${formatCurrency(result.processing_fee)}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={67}
                      paddingAngle={3}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">Total cost</span>
                  <span className="numeric mt-1 text-[14px] font-medium text-ink">
                    {formatCurrency(result.total_cost, { compact: true })}
                  </span>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {donutData.map((item) => (
                  <span key={item.name} className="flex items-center gap-1 text-[8px] text-faint">
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {affordability && (
            <div className={cn('mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between', style.wrapper)}>
              <div className="flex items-start gap-2.5">
                <StatusIcon className={cn('mt-0.5 h-4 w-4 shrink-0', style.iconClass)} aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-semibold text-ink">{affordability.message}</p>
                  <p className="mt-0.5 text-[9.5px] text-faint">
                    EMI is {formatPercent(affordability.emi_to_income_pct, 1)} of monthly income.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-4 sm:text-right">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Cash flow left</p>
                  <p className="numeric mt-0.5 text-[12px] text-ink">
                    {formatCurrency(affordability.free_cash_flow_after_emi)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Extra cost</p>
                  <p className="numeric mt-0.5 text-[12px] text-ink">{formatPercent(result.effective_cost_pct, 1)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
            <p className="flex items-center gap-1.5 text-[9px] text-faint">
              <Landmark className="h-3 w-3" aria-hidden="true" /> EMI includes principal and interest. Fees are paid upfront.
            </p>
            <Button size="sm" onClick={onSave} disabled={updating}>
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Save to tracker
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2 border-b border-line/60 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Amortisation</h2>
              <p className="mt-1 text-[11px] text-muted">How each instalment splits between interest and principal.</p>
            </div>
            <span className="rounded-md border border-line/70 bg-[#09121E] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
              {result.tenure_months} payments
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div
            className="h-[230px] w-full"
            role="img"
            aria-label={`Stacked amortisation chart over ${result.tenure_months} months`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.schedule} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1B2A3D" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#697B92', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.ceil(result.schedule.length / 8) - 1)}
                  dy={6}
                  tickFormatter={(value: number) => `M${value}`}
                />
                <YAxis
                  tick={{ fill: '#697B92', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
                  width={52}
                />
                <Tooltip
                  content={<ChartTooltip showTotal />}
                  cursor={{ fill: 'rgba(255,255,255,.025)' }}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Bar dataKey="principal" name="Principal" stackId="payment" fill="#44DCA9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="interest" name="Interest" stackId="payment" fill="#B49BFA" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 border-t border-line/60 pt-4">
            <span className="flex items-center gap-2 text-[10px] text-muted">
              <span className="h-1.5 w-3 rounded-full bg-emerald-400" /> Principal
            </span>
            <span className="flex items-center gap-2 text-[10px] text-muted">
              <span className="h-1.5 w-3 rounded-full bg-violet" /> Interest
            </span>
          </div>

          <details className="group mt-4 rounded-xl border border-line/70">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[10px] font-medium text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
              View full payment schedule
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="max-h-[280px] overflow-auto border-t border-line/70">
              <table className="w-full min-w-[480px] text-left text-[10px]">
                <thead className="sticky top-0 bg-[#0D1726] text-[8px] uppercase tracking-[0.08em] text-faint">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Month</th>
                    <th className="px-4 py-2.5 font-medium">EMI</th>
                    <th className="px-4 py-2.5 font-medium">Principal</th>
                    <th className="px-4 py-2.5 font-medium">Interest</th>
                    <th className="px-4 py-2.5 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {result.schedule.map((item) => (
                    <tr key={item.month} className="text-muted">
                      <td className="px-4 py-2 font-mono text-[9px]">{item.month}</td>
                      <td className="numeric px-4 py-2">{formatCurrency(item.emi)}</td>
                      <td className="numeric px-4 py-2 text-emerald-300/90">{formatCurrency(item.principal)}</td>
                      <td className="numeric px-4 py-2 text-violet/90">{formatCurrency(item.interest)}</td>
                      <td className="numeric px-4 py-2 text-right text-ink">{formatCurrency(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/60 bg-[#09121E]/55 px-3 py-2.5">
      <p className="text-[8px] uppercase tracking-[0.1em] text-faint">{label}</p>
      <p className="numeric mt-1 text-[12px] font-medium text-ink">{value}</p>
    </div>
  )
}
