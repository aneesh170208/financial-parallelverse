import type { ReactNode } from 'react'

import { formatCurrency } from '@/lib/utils'

interface ChartTooltipItem {
  value?: number | string | null
  dataKey?: string | number
  color?: string
  name?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipItem[]
  label?: ReactNode
  currency?: boolean
  showTotal?: boolean
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency = true,
  showTotal = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const visible = payload.filter((item) => item.value !== undefined && item.value !== null)
  if (!visible.length) return null
  const total = visible.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0)
  return (
    <div className="chart-tooltip min-w-[150px]">
      <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-faint">
        {String(label ?? '')}
      </p>
      <div className="space-y-1.5">
        {visible.map((item, index) => (
          <div key={`${String(item.dataKey)}-${index}`} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-[11px] text-muted">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color || '#44DCA9' }}
              />
              {item.name}
            </span>
            <span className="numeric text-[11px] font-medium text-ink">
              {currency && typeof item.value === 'number' ? formatCurrency(item.value) : String(item.value)}
            </span>
          </div>
        ))}
      </div>
      {showTotal && visible.length > 1 && (
        <div className="mt-2 flex items-center justify-between border-t border-line/70 pt-2 text-[11px]">
          <span className="text-muted">Total</span>
          <span className="numeric font-medium text-ink">{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  )
}
