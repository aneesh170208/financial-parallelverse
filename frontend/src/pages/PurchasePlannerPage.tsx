import { AlertCircle, GitFork } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Callout } from '@/components/common/Callout'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { PlanBlueprint } from '@/components/purchases/PlanBlueprint'
import { PurchaseForm, type PurchaseFormValue } from '@/components/purchases/PurchaseForm'
import { PurchaseTrajectory } from '@/components/purchases/PurchaseTrajectory'
import { ReadinessCard } from '@/components/purchases/ReadinessCard'
import { ReadinessChecks } from '@/components/purchases/ReadinessChecks'
import { SavePlanDialog, type SavedPlanInput } from '@/components/purchases/SavePlanDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getApiErrorMessage } from '@/lib/api'
import { useApp } from '@/lib/app-context'
import type { PurchaseAssessment, PurchasePlan } from '@/types/api'
import { toDateInput } from '@/lib/utils'

export function PurchasePlannerPage() {
  const { profile, dashboard, refresh } = useApp()
  const [form, setForm] = useState<PurchaseFormValue>(() => ({
    title: dashboard?.purchase.saved_plan_id ? dashboard.purchase.title : 'My next purchase',
    amount: dashboard?.purchase.amount ?? profile?.planned_purchase_amount ?? 70000,
    target_date: dashboard?.purchase.target_date ?? profile?.expected_purchase_date ?? toDateInput(new Date()),
  }))
  const [assessment, setAssessment] = useState<PurchaseAssessment | null>(null)
  const [plans, setPlans] = useState<PurchasePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const started = useRef(false)

  const activePlan = plans.find((plan) => plan.status === 'active') ?? null

  const runAssessment = useCallback(
    async (next: PurchaseFormValue, options: { notify?: boolean } = {}) => {
      setLoading(true)
      setError(null)
      try {
        const result = await api.assessPurchase({
          amount: next.amount,
          target_date: next.target_date,
          title: next.title,
        })
        setAssessment(result)
        if (options.notify) toast.success('Purchase plan analysed.')
      } catch (caught) {
        const message = getApiErrorMessage(caught)
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!profile || started.current) return
    started.current = true
    const initial: PurchaseFormValue = {
      title: dashboard?.purchase.saved_plan_id ? dashboard.purchase.title : 'My next purchase',
      amount: dashboard?.purchase.amount ?? profile.planned_purchase_amount,
      target_date: dashboard?.purchase.target_date ?? profile.expected_purchase_date,
    }
    setForm(initial)
    void runAssessment(initial)
    void api
      .getPurchasePlans()
      .then(setPlans)
      .catch((caught: unknown) => toast.error(getApiErrorMessage(caught)))
  }, [dashboard, profile, runAssessment])

  if (!profile) return null

  const tryAlternative = (amount: number) => {
    const next = { ...form, amount, title: `${form.title} — lighter option` }
    setForm(next)
    void runAssessment(next, { notify: true })
  }

  const handleSave = async (input: SavedPlanInput) => {
    if (!assessment) return
    setSaving(true)
    try {
      const created = await api.savePurchasePlan({
        title: input.title,
        amount: assessment.amount,
        target_date: assessment.target_date,
        monthly_saving_plan: input.monthlySaving,
        notes: input.notes,
        update_profile: true,
      })
      setPlans((current) => [
        created,
        ...current.map((plan) =>
          plan.status === 'active' ? { ...plan, status: 'archived' } : plan,
        ),
      ])
      setSaveOpen(false)
      toast.success('Purchase plan saved. Your profile is now aligned.')
      await refresh()
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activePlan) return
    setDeleting(true)
    try {
      await api.deletePurchasePlan(activePlan.id)
      setPlans((current) => current.filter((plan) => plan.id !== activePlan.id))
      setDeleteOpen(false)
      toast.success('Saved plan removed. Your profile was left unchanged.')
      await refresh()
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow="Purchase planner"
        title="Make room for what you want."
        description="Turn a purchase target into a realistic timeline without spending your safety net."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/futures">
              <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
              Compare 5 futures
            </Link>
          </Button>
        }
      />

      {error && (
        <Callout tone="danger" title="Assessment not updated">
          {error}
        </Callout>
      )}

      {loading && !assessment ? (
        <div className="space-y-4" aria-label="Analysing purchase plan">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
            <Skeleton className="h-[455px] rounded-2xl" />
            <Skeleton className="h-[455px] rounded-2xl" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
            <Skeleton className="h-[385px] rounded-2xl" />
            <Skeleton className="h-[385px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
            {assessment ? (
              <ReadinessCard
                assessment={assessment}
                activePlanTitle={activePlan?.title ?? null}
                saving={saving}
                onSave={() => setSaveOpen(true)}
                onTryAlternative={tryAlternative}
              />
            ) : (
              <Card className="flex h-full items-center">
                <ErrorState
                  message={error || 'The purchase assessment could not be loaded. You can adjust the values and try again.'}
                  onRetry={() => void runAssessment(form, { notify: true })}
                />
              </Card>
            )}
            <PurchaseForm
              value={form}
              onChange={setForm}
              onSubmit={() => void runAssessment(form, { notify: true })}
              onDeleteSavedPlan={() => setDeleteOpen(true)}
              loading={loading}
              profile={profile}
              activePlan={activePlan}
            />
          </div>

          {assessment && (
            <>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
                <PurchaseTrajectory assessment={assessment} />
                <ReadinessChecks assessment={assessment} />
              </div>

              <PlanBlueprint assessment={assessment} saving={saving} onSave={() => setSaveOpen(true)} />

              <div className="flex flex-col justify-between gap-2 rounded-xl border border-line/60 bg-white/[0.015] px-4 py-3 sm:flex-row sm:items-center">
                <p className="flex items-start gap-2 text-[9px] leading-relaxed text-faint">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                  This planner separates your emergency reserve from spendable savings. It does not recommend borrowing
                  against the reserve.
                </p>
                <span className="shrink-0 text-[9px] text-faint">Illustrative projection · not financial advice</span>
              </div>
            </>
          )}
        </>
      )}

      {assessment && (
        <>
          <SavePlanDialog
            open={saveOpen}
            onOpenChange={setSaveOpen}
            assessment={assessment}
            defaultTitle={form.title}
            saving={saving}
            onSave={(input) => void handleSave(input)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Remove the saved purchase plan?"
            description="This removes the saved plan from this workspace. Your financial profile values will not be changed."
            confirmLabel="Remove plan"
            variant="destructive"
            onConfirm={() => void handleDelete()}
            loading={deleting}
          />
        </>
      )}
    </div>
  )
}
