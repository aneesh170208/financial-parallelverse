import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  detail: ReactNode
  icon: LucideIcon
  tone?: 'emerald' | 'sky' | 'amber' | 'violet'
  className?: string
}

const tones = {
  emerald: 'border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300',
  sky: 'border-sky/15 bg-sky/[0.06] text-sky',
  amber: 'border-amber/15 bg-amber/[0.06] text-amber',
  violet: 'border-violet/15 bg-violet/[0.06] text-violet',
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'emerald', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-line/80 bg-surface/90 p-4 shadow-card sm:p-[18px]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[11px] font-medium text-muted">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border', tones[tone])}>
          <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <p className="numeric mt-3 text-[23px] font-medium leading-none tracking-[-0.045em] text-ink">{value}</p>
      <div className="mt-3 text-[10px] leading-relaxed text-faint">{detail}</div>
      <span className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full border border-white/[0.03] transition-transform duration-500 group-hover:scale-125" />
    </div>
  )
}
