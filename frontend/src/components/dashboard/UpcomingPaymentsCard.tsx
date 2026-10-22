import { ArrowRight, CalendarCheck2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { DueBadge } from '@/components/common/RiskBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UpcomingInstallment } from '@/types/api'
import { dueLabel, formatCurrency, formatDueDate } from '@/lib/utils'

interface UpcomingPaymentsCardProps {
  installments: UpcomingInstallment[]
  monthlyCommitment: number
  activeCount: number
}

export function UpcomingPaymentsCard({
  installments,
  monthlyCommitment,
  activeCount,
}: UpcomingPaymentsCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle>Upcoming payments</CardTitle>
          <p className="mt-1 text-[11px] text-muted">
            {formatCurrency(monthlyCommitment)}/mo across {activeCount} active plan{activeCount === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          to="/installments"
          className="text-[10px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-1">
        {installments.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="No payments due"
            description="Your tracked installments are clear for now."
            className="flex-1 px-2 py-8"
            action={
              <Link to="/installments" className="text-[11px] font-semibold text-emerald-300">
                Open tracker
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-line/60">
            {installments.map((payment) => (
              <Link
                key={payment.id}
                to="/installments"
                className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-[#09121E] text-faint transition-colors group-hover:border-line group-hover:text-muted">
                  <span className="text-[11px] font-semibold">{payment.name.slice(0, 1)}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-ink">{payment.name}</p>
                  <p className="mt-0.5 text-[10px] text-faint">
                    {payment.merchant || 'Manual plan'} · {formatDueDate(payment.due_date)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="numeric text-[11px] font-medium text-ink">{formatCurrency(payment.amount)}</p>
                  <div className="mt-1.5">
                    <DueBadge
                      status={payment.due_status}
                      label={dueLabel(payment.due_status, payment.days_until_due)}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-auto border-t border-line/60 pt-3">
          <Link
            to="/installments"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted transition-colors hover:text-ink"
          >
            Review the tracker <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
