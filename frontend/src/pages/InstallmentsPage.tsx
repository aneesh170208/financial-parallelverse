import {
  ArrowUpRight,
  BellRing,
  Calculator,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  History,
  Layers,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Callout } from '@/components/common/Callout'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AddInstallmentDialog } from '@/components/installments/AddInstallmentDialog'
import { InstallmentCard } from '@/components/installments/InstallmentCard'
import { DueBadge } from '@/components/common/RiskBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getApiErrorMessage } from '@/lib/api'
import { useApp } from '@/lib/app-context'
import type { InstallmentCollection, InstallmentInput, InstallmentPlan } from '@/types/api'
import {
  dueLabel,
  formatCurrency,
  formatDate,
  formatDueDate,
  formatPercent,
  clamped,
  relativeTime,
} from '@/lib/utils'

type TrackerTab = 'active' | 'completed'

function ReminderList({
  collection,
  onPay,
  busyId,
}: {
  collection: InstallmentCollection
  onPay: (plan: InstallmentPlan) => void
  busyId: number | null
}) {
  const reminderPlans = collection.reminders
    .map((reminder) => collection.plans.find((plan) => plan.id === reminder.plan_id))
    .filter((plan): plan is InstallmentPlan => Boolean(plan))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber" aria-hidden="true" />
            Payment radar
          </CardTitle>
          <p className="mt-1 text-[11px] text-muted">Due within the next 14 days</p>
        </div>
        <span className="numeric rounded-full border border-line bg-white/[0.025] px-2 py-0.5 text-[10px] text-muted">
          {reminderPlans.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {reminderPlans.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing due soon"
            description="No tracked payments are due in the next two weeks."
            className="px-5 py-8"
          />
        ) : (
          <div className="divide-y divide-line/60">
            {reminderPlans.map((plan) => {
              const reminder = collection.reminders.find((item) => item.plan_id === plan.id)
              if (!reminder) return null
              return (
                <div key={plan.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span
                    className={
                      reminder.due_status === 'overdue'
                        ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose/20 bg-rose/[0.07] text-rose'
                        : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/20 bg-amber/[0.06] text-amber'
                    }
                  >
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-ink">{plan.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-faint">
                      <span>{formatDueDate(reminder.due_date)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="numeric">{formatCurrency(reminder.amount)}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => onPay(plan)}
                    loading={busyId === plan.id}
                    aria-label={`Mark ${plan.name} payment as made`}
                  >
                    Pay
                  </Button>
                </div>
              )
            })}
          </div>
        )}
        {collection.summary.overdue_count > 0 && (
          <div className="border-t border-rose/15 bg-rose/[0.045] px-4 py-2.5 text-[9px] text-rose sm:px-5">
            {collection.summary.overdue_count} plan{collection.summary.overdue_count === 1 ? ' has' : 's have'} an
            overdue payment. Settle it before adding another commitment.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function InstallmentsPage() {
  const { profile, refresh } = useApp()
  const [collection, setCollection] = useState<InstallmentCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TrackerTab>('active')
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [payTarget, setPayTarget] = useState<InstallmentPlan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InstallmentPlan | null>(null)
  const [paying, setPaying] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      setCollection(await api.getInstallments())
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activePlans = useMemo(
    () => (collection?.plans ?? []).filter((plan) => plan.status === 'active'),
    [collection],
  )
  const completedPlans = useMemo(
    () => (collection?.plans ?? []).filter((plan) => plan.status !== 'active'),
    [collection],
  )
  const visiblePlans = tab === 'active' ? activePlans : completedPlans

  if (!profile) return null

  const monthlyIncome = Math.max(profile.monthly_income, 1)
  const commitment = collection?.summary.monthly_commitment ?? 0
  const commitmentPct = (commitment / monthlyIncome) * 100
  const freeCashAfter = profile.monthly_free_cash_flow - commitment
  const freeCashUsedPct =
    profile.monthly_free_cash_flow > 0 ? clamped((commitment / profile.monthly_free_cash_flow) * 100, 0, 100) : 100

  const handleAdd = async (input: InstallmentInput) => {
    setAdding(true)
    try {
      await api.createInstallment(input)
      setAddOpen(false)
      setTab('active')
      toast.success('Installment plan added to your tracker.')
      await Promise.all([load(true), refresh()])
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setAdding(false)
    }
  }

  const handlePay = async () => {
    if (!payTarget) return
    setPaying(true)
    try {
      const updated = await api.payInstallment(payTarget.id)
      setPayTarget(null)
      toast.success(
        updated.status === 'completed'
          ? `${updated.name} is fully paid off.`
          : `Payment recorded for ${updated.name}.`,
      )
      await Promise.all([load(true), refresh()])
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setPaying(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteInstallment(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Installment plan removed from the tracker.')
      await Promise.all([load(true), refresh()])
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  const nextDue = collection?.summary.next_due_date
    ? formatDueDate(collection.summary.next_due_date)
    : 'Nothing scheduled'
  const lastUpdated = collection?.plans[0]?.created_at
    ? relativeTime(collection.plans[0].created_at)
    : null

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow="Installment tracker"
        title="Every payment, accounted for."
        description="Keep EMIs and pay-later plans visible so a small monthly amount never becomes a silent cash-flow leak."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to="/emi">
                <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                Calculate an EMI
              </Link>
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={adding}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add installment
            </Button>
          </>
        }
      />

      {error && collection && (
        <Callout tone="warning" title="The tracker may be out of date">
          {error} You can keep reviewing the last loaded data, or retry below.
        </Callout>
      )}

      {loading && !collection ? (
        <div className="space-y-4" aria-label="Loading installment tracker">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[124px] rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
            <div className="space-y-3">
              <Skeleton className="h-[218px] rounded-2xl" />
              <Skeleton className="h-[218px] rounded-2xl" />
            </div>
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        </div>
      ) : !collection ? (
        <ErrorState message={error || 'The tracker could not be loaded.'} onRetry={() => void load()} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Installment summary">
            <MetricCard
              label="Active plans"
              value={String(collection.summary.active_plans)}
              icon={Layers}
              tone="sky"
              detail={
                collection.summary.overdue_count > 0
                  ? `${collection.summary.overdue_count} overdue · needs attention`
                  : `${collection.summary.due_soon_count} due within a week`
              }
            />
            <MetricCard
              label="Monthly commitment"
              value={formatCurrency(commitment, { compact: true })}
              icon={CreditCard}
              tone="amber"
              detail={`${formatPercent(commitmentPct, 1)} of your monthly income`}
            />
            <MetricCard
              label="Outstanding balance"
              value={formatCurrency(collection.summary.outstanding_total, { compact: true })}
              icon={Wallet}
              tone="violet"
              detail={`${completedPlans.length} completed plan${completedPlans.length === 1 ? '' : 's'} in history`}
            />
            <MetricCard
              label="Next payment"
              value={nextDue}
              icon={CalendarRange}
              tone="emerald"
              detail={
                lastUpdated
                  ? `Tracker refreshed ${lastUpdated}`
                  : 'Mark payments as you make them to keep this current'
              }
            />
          </section>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.85fr)]">
            <section className="space-y-3" aria-label="Installment plans">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl<TrackerTab>
                  value={tab}
                  onChange={setTab}
                  ariaLabel="Filter installment plans"
                  options={[
                    { value: 'active', label: `Active · ${activePlans.length}`, icon: Layers },
                    { value: 'completed', label: `History · ${completedPlans.length}`, icon: History },
                  ]}
                />
                <div className="flex items-center gap-2 text-[9px] text-faint">
                  {refreshing && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />}
                  <span>{refreshing ? 'Refreshing' : 'Sorted by urgency'}</span>
                </div>
              </div>

              {visiblePlans.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={tab === 'active' ? CheckCircle2 : History}
                    title={tab === 'active' ? 'No active installments' : 'No completed plans yet'}
                    description={
                      tab === 'active'
                        ? 'Add a plan to keep its payment schedule and reminders in one place.'
                        : 'Plans move here automatically once every installment has been paid.'
                    }
                    action={
                      tab === 'active' ? (
                        <Button size="sm" onClick={() => setAddOpen(true)}>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          Add your first plan
                        </Button>
                      ) : undefined
                    }
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {visiblePlans.map((plan) => (
                    <InstallmentCard
                      key={plan.id}
                      plan={plan}
                      busy={paying || deleting}
                      onPay={setPayTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4" aria-label="Commitment and reminders">
              <ReminderList collection={collection} onPay={setPayTarget} busyId={paying ? payTarget?.id ?? null : null} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    Can the month carry it?
                  </CardTitle>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    Tracked installments sit on top of your existing debt payments.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="text-[10px] text-faint">Free cash flow used</span>
                      <span className="numeric text-[13px] font-medium text-ink">{formatPercent(freeCashUsedPct, 0)}</span>
                    </div>
                    <Progress
                      value={freeCashUsedPct}
                      label="Share of free cash flow used by installments"
                      indicatorClassName={
                        freeCashUsedPct >= 90 ? 'bg-rose' : freeCashUsedPct >= 60 ? 'bg-amber' : undefined
                      }
                    />
                  </div>
                  <div className="space-y-2 border-t border-line/60 pt-3 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Monthly income</span>
                      <span className="numeric text-muted">{formatCurrency(profile.monthly_income)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Free before installments</span>
                      <span className="numeric text-muted">{formatCurrency(profile.monthly_free_cash_flow)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-faint">Installment commitment</span>
                      <span className="numeric text-amber">−{formatCurrency(commitment)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-line/60 pt-2">
                      <span className="font-medium text-ink">Left after installments</span>
                      <span className={freeCashAfter < 0 ? 'numeric font-medium text-rose' : 'numeric font-medium text-emerald-300'}>
                        {formatCurrency(freeCashAfter)}
                      </span>
                    </div>
                  </div>
                  {freeCashAfter < 0 ? (
                    <p className="rounded-lg border border-rose/20 bg-rose/[0.05] px-3 py-2 text-[9px] leading-relaxed text-rose">
                      Your tracked installments exceed monthly free cash flow. Avoid new commitments and consider a
                      lighter payment plan.
                    </p>
                  ) : (
                    <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-faint">
                      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" aria-hidden="true" />
                      This check uses your profile income and spending. It does not include investment returns or
                      emergency-fund withdrawals.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-line/60 bg-white/[0.015]">
                <CardContent className="flex items-start gap-2.5 p-4">
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                  <p className="text-[9px] leading-relaxed text-faint">
                    Your emergency reserve stays ring-fenced. Paying off an installment does not automatically move
                    money from savings — update your profile if the payment came from there.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>

          <p className="px-1 pt-1 text-[9px] leading-relaxed text-faint/80">
            Installments are recorded locally. Marking a payment as paid updates the next due date by one month; it
            does not move money or contact a lender.
          </p>
        </>
      )}

      <AddInstallmentDialog open={addOpen} onOpenChange={setAddOpen} saving={adding} onSave={(input) => void handleAdd(input)} />

      <ConfirmDialog
        open={!!payTarget}
        onOpenChange={(open) => !open && setPayTarget(null)}
        title="Mark this installment as paid?"
        description="This records the payment against the current due date and rolls the schedule forward by one month."
        confirmLabel="Mark as paid"
        onConfirm={() => void handlePay()}
        loading={paying}
      >
        {payTarget && (
          <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="text-faint">{payTarget.name}</span>
              <DueBadge
                status={payTarget.due_status}
                label={dueLabel(payTarget.due_status, payTarget.days_until_due)}
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[10px] text-faint">Payment amount</span>
              <span className="numeric text-[16px] font-medium text-ink">
                {formatCurrency(payTarget.monthly_installment)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9px]">
              <span className="text-faint">Due date</span>
              <span className="text-muted">{formatDueDate(payTarget.next_due_date)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9px]">
              <span className="text-faint">Payment</span>
              <span className="text-muted">
                {payTarget.paid_installments + 1} of {payTarget.tenure_months}
              </span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this installment plan?"
        description="This deletes the plan and its payment history from this workspace. Your financial profile will not change."
        confirmLabel="Remove plan"
        variant="destructive"
        onConfirm={() => void handleDelete()}
        loading={deleting}
      >
        {deleteTarget && (
          <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
            <p className="text-[11px] font-semibold text-ink">{deleteTarget.name}</p>
            <p className="mt-1 text-[9px] text-faint">
              {deleteTarget.merchant || 'Manual plan'} · created{' '}
              {formatDate(deleteTarget.created_at, 'medium')}
            </p>
            <p className="numeric mt-2 text-[11px] text-muted">
              {formatCurrency(deleteTarget.monthly_installment)} / month · {deleteTarget.remaining_installments} remaining
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
