import { Check, CircleCheck, Clock3, ReceiptText, Trash2 } from 'lucide-react'

import { DueBadge } from '@/components/common/RiskBadge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { InstallmentPlan } from '@/types/api'
import {
  cn,
  dueLabel,
  formatCurrency,
  formatDate,
  formatDueDate,
  formatPercent,
} from '@/lib/utils'

export function InstallmentCard({
  plan,
  busy,
  onPay,
  onDelete,
}: {
  plan: InstallmentPlan
  busy: boolean
  onPay: (plan: InstallmentPlan) => void
  onDelete: (plan: InstallmentPlan) => void
}) {
  const completed = plan.status === 'completed' || plan.due_status === 'completed'
  const urgent = plan.due_status === 'overdue' || plan.due_status === 'due_soon'
  const lastPayment = plan.payments[0] ?? null
  const paidAmount = plan.monthly_installment * plan.paid_installments
  const totalScheduled = plan.monthly_installment * plan.tenure_months

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-surface/90 shadow-card transition-colors',
        completed
          ? 'border-emerald-400/15'
          : plan.due_status === 'overdue'
            ? 'border-rose/25'
            : plan.due_status === 'due_soon'
              ? 'border-amber/20'
              : 'border-line/80 hover:border-[#2C4059]',
      )}
      aria-label={`${plan.name} installment plan`}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-px',
          completed
            ? 'bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent'
            : urgent
              ? 'bg-gradient-to-r from-transparent via-amber/30 to-transparent'
              : 'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent',
        )}
      />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[11px] font-bold',
              completed
                ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300'
                : urgent
                  ? 'border-amber/20 bg-amber/[0.07] text-amber'
                  : 'border-line bg-elevated/80 text-sand',
            )}
          >
            {completed ? (
              <CircleCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              plan.name.trim().slice(0, 1).toUpperCase() || <ReceiptText className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">{plan.name}</h3>
                <p className="mt-0.5 text-[10px] text-faint">
                  {plan.merchant || 'Manual plan'} · {plan.tenure_months}-month schedule
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DueBadge
                  status={plan.due_status}
                  label={completed ? 'Completed' : dueLabel(plan.due_status, plan.days_until_due)}
                />
                <div className="text-right">
                  <p className="numeric text-[15px] font-medium leading-none text-ink">
                    {formatCurrency(plan.monthly_installment)}
                  </p>
                  <p className="mt-1 text-[9px] text-faint">per month</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[9px]">
                <span className="text-faint">
                  {plan.paid_installments} of {plan.tenure_months} paid
                </span>
                <span className={completed ? 'numeric text-emerald-300' : 'numeric text-muted'}>
                  {formatPercent(plan.progress_pct, plan.progress_pct % 1 === 0 ? 0 : 1)}
                </span>
              </div>
              <Progress
                value={plan.progress_pct}
                label={`${plan.name} payment progress`}
                indicatorClassName={completed ? 'bg-emerald-400' : urgent ? 'bg-amber' : undefined}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line/60 pt-3 sm:grid-cols-3">
              <div>
                <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Outstanding</p>
                <p className="numeric mt-1 text-[12px] font-medium text-ink">
                  {formatCurrency(completed ? 0 : plan.outstanding_amount)}
                </p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.1em] text-faint">
                  {completed ? 'Paid through schedule' : 'Next payment'}
                </p>
                <p className="numeric mt-1 text-[12px] font-medium text-ink">
                  {completed ? formatCurrency(paidAmount) : formatDueDate(plan.next_due_date)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Remaining</p>
                <p className="numeric mt-1 text-[12px] font-medium text-ink">
                  {completed
                    ? `${plan.tenure_months} of ${plan.tenure_months} paid`
                    : `${plan.remaining_installments} installment${plan.remaining_installments === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {plan.notes && (
              <p className="mt-3 line-clamp-2 rounded-lg border border-line/50 bg-white/[0.015] px-3 py-2 text-[9.5px] leading-relaxed text-faint">
                {plan.notes}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[9px] text-faint">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                {lastPayment
                  ? `Last paid ${formatDate(lastPayment.paid_at, 'medium')}`
                  : completed
                    ? `Scheduled total ${formatCurrency(totalScheduled)}`
                    : 'No payments logged yet'}
              </p>
              <div className="flex items-center gap-1.5">
                {!completed && (
                  <Button size="sm" variant={urgent ? 'primary' : 'secondary'} onClick={() => onPay(plan)} disabled={busy}>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Mark next paid
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onDelete(plan)}
                  disabled={busy}
                  aria-label={`Delete ${plan.name}`}
                  title="Delete plan"
                  className="text-faint hover:text-rose"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
