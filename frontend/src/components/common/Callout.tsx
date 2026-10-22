import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CalloutTone = 'info' | 'success' | 'warning' | 'danger'

const config = {
  info: { icon: Info, className: 'border-sky/20 bg-sky/[0.055] text-sky' },
  success: { icon: CheckCircle2, className: 'border-emerald-400/20 bg-emerald-400/[0.055] text-emerald-300' },
  warning: { icon: AlertTriangle, className: 'border-amber/20 bg-amber/[0.06] text-amber' },
  danger: { icon: ShieldAlert, className: 'border-rose/20 bg-rose/[0.06] text-rose' },
}

interface CalloutProps {
  tone?: CalloutTone
  title?: string
  children: ReactNode
  className?: string
}

export function Callout({ tone = 'info', title, children, className }: CalloutProps) {
  const item = config[tone]
  const Icon = item.icon
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3.5', item.className, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-xs leading-relaxed">
        {title && <p className="mb-0.5 font-semibold text-ink">{title}</p>}
        <div className="text-muted">{children}</div>
      </div>
    </div>
  )
}
