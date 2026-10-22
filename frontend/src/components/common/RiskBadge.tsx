import { ShieldAlert, ShieldCheck, ShieldHalf, OctagonAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { RiskLevel } from '@/types/api'

const riskConfig = {
  resilient: { variant: 'success' as const, icon: ShieldCheck, label: 'Resilient' },
  steady: { variant: 'info' as const, icon: ShieldHalf, label: 'Steady' },
  fragile: { variant: 'warning' as const, icon: ShieldAlert, label: 'Fragile' },
  critical: { variant: 'danger' as const, icon: OctagonAlert, label: 'Critical' },
}

export function RiskBadge({ risk, label, className }: { risk: RiskLevel; label?: string; className?: string }) {
  const config = riskConfig[risk] ?? riskConfig.steady
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label || config.label}
    </Badge>
  )
}

export function DueBadge({ status, label }: { status: string; label: string }) {
  const variant =
    status === 'overdue'
      ? 'danger'
      : status === 'due_soon'
        ? 'warning'
        : status === 'completed'
          ? 'success'
          : 'default'
  return <Badge variant={variant}>{label}</Badge>
}
