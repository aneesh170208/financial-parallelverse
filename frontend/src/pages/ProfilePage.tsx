import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Info,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/common/Callout'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError, FieldHint, Input, Label } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/lib/app-context'
import { deriveProfilePreview, type ProfileNumbers } from '@/lib/profile-math'
import type { Profile } from '@/types/api'
import {
  addMonths,
  clamped,
  daysInFuture,
  formatCurrency,
  formatDate,
  formatPercent,
  parseDate,
} from '@/lib/utils'

interface FormValues {
  name: string
  monthlyIncome: string
  currentSavings: string
  essentialExpenses: string
  discretionaryExpenses: string
  debtPayments: string
  emergencyTarget: string
  plannedPurchase: string
  expectedDate: string
}

type FieldKey = keyof FormValues

const fieldIds: Record<FieldKey, string> = {
  name: 'profile-name',
  monthlyIncome: 'profile-income',
  currentSavings: 'profile-savings',
  essentialExpenses: 'profile-essential',
  discretionaryExpenses: 'profile-discretionary',
  debtPayments: 'profile-debt',
  emergencyTarget: 'profile-emergency-target',
  plannedPurchase: 'profile-purchase',
  expectedDate: 'profile-purchase-date',
}

function profileValues(profile: Profile): FormValues {
  return {
    name: profile.name,
    monthlyIncome: String(profile.monthly_income),
    currentSavings: String(profile.current_savings),
    essentialExpenses: String(profile.essential_expenses),
    discretionaryExpenses: String(profile.discretionary_expenses),
    debtPayments: String(profile.existing_debt_payments),
    emergencyTarget: String(profile.emergency_fund_target),
    plannedPurchase: String(profile.planned_purchase_amount),
    expectedDate: profile.expected_purchase_date,
  }
}

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function currencyError(value: string, label: string): string | null {
  if (!value.trim()) return `Enter your ${label.toLowerCase()}.`
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 'Enter a valid amount.'
  if (parsed < 0) return 'This amount cannot be negative.'
  if (parsed > 1_000_000_000) return 'Keep this amount under ₹1,000,000,000.'
  return null
}

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.name.trim()) errors.name = 'Enter a name for this profile.'
  if (values.name.trim().length > 80) errors.name = 'Keep the name under 80 characters.'

  const checks: Array<[FieldKey, string]> = [
    ['monthlyIncome', 'monthly income'],
    ['currentSavings', 'current savings'],
    ['essentialExpenses', 'essential expenses'],
    ['discretionaryExpenses', 'discretionary spending'],
    ['debtPayments', 'existing debt payments'],
    ['emergencyTarget', 'emergency fund target'],
    ['plannedPurchase', 'planned purchase amount'],
  ]
  checks.forEach(([key, label]) => {
    const message = currencyError(values[key], label)
    if (message) errors[key] = message
  })

  if (!values.expectedDate || Number.isNaN(parseDate(values.expectedDate).getTime())) {
    errors.expectedDate = 'Choose a valid target date.'
  }
  return errors
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserRound
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-line/60 px-5 py-5 last:border-b-0 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-[#09121E] text-emerald-300">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-faint">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function CurrencyField({
  field,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  field: FieldKey
  label: string
  hint?: string
  value: string
  error?: string
  onChange: (field: FieldKey, value: string) => void
}) {
  return (
    <div>
      <Label htmlFor={fieldIds[field]}>{label}</Label>
      <Input
        id={fieldIds[field]}
        type="number"
        min={0}
        step="any"
        leading="₹"
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        invalid={!!error}
      />
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  )
}

function healthTone(score: number) {
  if (score >= 85) return { text: 'text-emerald-300', bg: 'bg-emerald-400', border: 'border-emerald-400/20' }
  if (score >= 70) return { text: 'text-sky', bg: 'bg-sky', border: 'border-sky/20' }
  if (score >= 50) return { text: 'text-amber', bg: 'bg-amber', border: 'border-amber/20' }
  return { text: 'text-rose', bg: 'bg-rose', border: 'border-rose/20' }
}

export function ProfilePage() {
  const { profile, updateProfile, restoreDemoProfile } = useApp()
  const initial = useMemo(() => (profile ? profileValues(profile) : null), [profile])
  const [values, setValues] = useState<FormValues>(() => (profile ? profileValues(profile) : {
    name: '',
    monthlyIncome: '',
    currentSavings: '',
    essentialExpenses: '',
    discretionaryExpenses: '',
    debtPayments: '',
    emergencyTarget: '',
    plannedPurchase: '',
    expectedDate: '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const syncedAt = useRef(profile?.updated_at ?? '')

  const dirty = useMemo(() => {
    if (!initial) return false
    return (Object.keys(initial) as FieldKey[]).some((key) => values[key] !== initial[key])
  }, [initial, values])

  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // Pick up changes that originate outside this form (for example, restoring
  // the demo profile) without discarding in-progress edits.
  useEffect(() => {
    if (!profile || profile.updated_at === syncedAt.current) return
    syncedAt.current = profile.updated_at
    if (!dirty) setValues(profileValues(profile))
  }, [profile, dirty])

  const numbers: ProfileNumbers = {
    monthly_income: toNumber(values.monthlyIncome),
    current_savings: toNumber(values.currentSavings),
    essential_expenses: toNumber(values.essentialExpenses),
    discretionary_expenses: toNumber(values.discretionaryExpenses),
    existing_debt_payments: toNumber(values.debtPayments),
    emergency_fund_target: toNumber(values.emergencyTarget),
    planned_purchase_amount: toNumber(values.plannedPurchase),
  }
  const preview = deriveProfilePreview(numbers)
  const tone = healthTone(preview.healthScore)
  const purchaseDateInPast = values.expectedDate ? daysInFuture(values.expectedDate) < 0 : false
  const projectedDate =
    preview.monthsToPurchase === null
      ? null
      : addMonths(new Date(), preview.monthsToPurchase)
  const reservePct =
    numbers.emergency_fund_target > 0
      ? clamped((numbers.current_savings / numbers.emergency_fund_target) * 100, 0, 100)
      : numbers.current_savings > 0
        ? 100
        : 0

  if (!profile) return null

  const update = (field: FieldKey, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setSaveError(null)
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0] as FieldKey | undefined
    if (firstError) {
      toast.error(nextErrors[firstError])
      document.getElementById(fieldIds[firstError])?.focus()
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateProfile({
        name: values.name.trim(),
        monthly_income: toNumber(values.monthlyIncome),
        current_savings: toNumber(values.currentSavings),
        essential_expenses: toNumber(values.essentialExpenses),
        discretionary_expenses: toNumber(values.discretionaryExpenses),
        existing_debt_payments: toNumber(values.debtPayments),
        emergency_fund_target: toNumber(values.emergencyTarget),
        planned_purchase_amount: toNumber(values.plannedPurchase),
        expected_purchase_date: values.expectedDate,
      })
      setValues(profileValues(updated))
      syncedAt.current = updated.updated_at
      toast.success('Profile saved. Every forecast now uses your latest numbers.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The profile could not be saved.'
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    setSaveError(null)
    try {
      const restored = await restoreDemoProfile()
      setValues(profileValues(restored))
      setErrors({})
      syncedAt.current = restored.updated_at
      setRestoreOpen(false)
      toast.success('Demo profile restored. Saved plans and payment history were left intact.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The demo profile could not be restored.'
      toast.error(message)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow="Financial profile"
        title="The facts behind every forecast."
        description="Keep your income, spending and safety net honest. Every projection in the workspace begins here."
        actions={
          <>
            {dirty && (
              <Badge variant="warning" className="hidden sm:inline-flex">
                Unsaved edits
              </Badge>
            )}
            <Button variant="secondary" size="sm" onClick={() => setRestoreOpen(true)} disabled={saving || restoring}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Restore demo
            </Button>
          </>
        }
      />

      {saveError && (
        <Callout tone="danger" title="Profile not saved">
          {saveError}
        </Callout>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <form onSubmit={handleSubmit} noValidate>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">Your financial picture</h2>
                <p className="mt-0.5 text-[10px] text-faint">Changes stay on this device until you save them.</p>
              </div>
              {dirty ? (
                <span className="flex items-center gap-1.5 rounded-full border border-amber/20 bg-amber/[0.06] px-2.5 py-1 text-[9px] font-medium text-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
                  Not saved yet
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[9px] text-faint">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                  In sync with saved profile
                </span>
              )}
            </div>

            <FormSection icon={UserRound} title="About you" description="A name personalises the workspace.">
              <div>
                <Label htmlFor={fieldIds.name}>Display name</Label>
                <Input
                  id={fieldIds.name}
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  invalid={!!errors.name}
                  autoComplete="name"
                  placeholder="Aarav Mehta"
                />
                {errors.name ? (
                  <FieldError>{errors.name}</FieldError>
                ) : (
                  <FieldHint>Used only inside this local demo workspace.</FieldHint>
                )}
              </div>
            </FormSection>

            <FormSection
              icon={Wallet}
              title="Monthly cash flow"
              description="Take-home income and the commitments that leave your account every month."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyField
                  field="monthlyIncome"
                  label="Monthly take-home income"
                  hint="After tax, in your bank account."
                  value={values.monthlyIncome}
                  error={errors.monthlyIncome}
                  onChange={update}
                />
                <CurrencyField
                  field="currentSavings"
                  label="Current savings"
                  hint="Cash and deposits you can access."
                  value={values.currentSavings}
                  error={errors.currentSavings}
                  onChange={update}
                />
                <CurrencyField
                  field="essentialExpenses"
                  label="Essential expenses"
                  hint="Rent, food, utilities, transport."
                  value={values.essentialExpenses}
                  error={errors.essentialExpenses}
                  onChange={update}
                />
                <CurrencyField
                  field="discretionaryExpenses"
                  label="Discretionary spending"
                  hint="Lifestyle, dining and non-essentials."
                  value={values.discretionaryExpenses}
                  error={errors.discretionaryExpenses}
                  onChange={update}
                />
                <CurrencyField
                  field="debtPayments"
                  label="Existing debt payments"
                  hint="Loan and card payments, excluding tracked installments."
                  value={values.debtPayments}
                  error={errors.debtPayments}
                  onChange={update}
                />
                <div className="flex items-end">
                  <div className="w-full rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] text-faint">Total monthly outgo</span>
                      <span className="numeric text-[11px] text-ink">{formatCurrency(preview.monthlyExpenses)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-line/60 pt-2">
                      <span className="text-[9px] font-medium text-muted">Free cash flow</span>
                      <span className={preview.freeCashFlow < 0 ? 'numeric text-[13px] font-medium text-rose' : 'numeric text-[13px] font-medium text-emerald-300'}>
                        {formatCurrency(preview.freeCashFlow, { sign: preview.freeCashFlow > 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {preview.freeCashFlow < 0 && (
                <Callout tone="warning" className="mt-4">
                  Your outgoings are higher than your income. The health score will stay fragile until cash flow turns
                  positive.
                </Callout>
              )}
            </FormSection>

            <FormSection
              icon={ShieldCheck}
              title="Safety net & next goal"
              description="The reserve is protected first. Only savings above it count as spendable."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CurrencyField
                  field="emergencyTarget"
                  label="Emergency fund target"
                  hint="Aim for 3–6 months of essential expenses."
                  value={values.emergencyTarget}
                  error={errors.emergencyTarget}
                  onChange={update}
                />
                <CurrencyField
                  field="plannedPurchase"
                  label="Planned purchase amount"
                  hint="The next purchase you are evaluating."
                  value={values.plannedPurchase}
                  error={errors.plannedPurchase}
                  onChange={update}
                />
                <div>
                  <Label htmlFor={fieldIds.expectedDate}>Target purchase date</Label>
                  <Input
                    id={fieldIds.expectedDate}
                    type="date"
                    value={values.expectedDate}
                    onChange={(event) => update('expectedDate', event.target.value)}
                    invalid={!!errors.expectedDate}
                  />
                  {errors.expectedDate ? (
                    <FieldError>{errors.expectedDate}</FieldError>
                  ) : purchaseDateInPast ? (
                    <FieldHint className="text-amber">This date has already passed — the planner will flag it.</FieldHint>
                  ) : (
                    <FieldHint>Used by the purchase planner as its target window.</FieldHint>
                  )}
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-[9px] text-faint">
                      <Lock className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                      Ring-fenced reserve
                    </div>
                    <p className="numeric mt-2 text-[16px] font-medium text-ink">{formatCurrency(numbers.emergency_fund_target)}</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-faint">
                      Never counted as spendable, even when savings grow.
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

            <div className="flex flex-col-reverse gap-2 border-t border-line/80 bg-white/[0.012] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-faint">
                <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                Refreshing the page discards unsaved edits.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValues(profileValues(profile))
                    setErrors({})
                    setSaveError(null)
                  }}
                  disabled={!dirty || saving}
                >
                  Reset changes
                </Button>
                <Button type="submit" size="sm" loading={saving} disabled={!dirty}>
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Save profile
                </Button>
              </div>
            </div>
          </Card>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-[86px]" aria-label="Live profile preview">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    Live preview
                  </CardTitle>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    What these numbers mean before you save.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {profile.currency}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-xl border ${tone.border} bg-white/[0.018] p-4`} aria-live="polite">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-faint">Financial weather</p>
                    <p className={`mt-1.5 text-[17px] font-semibold ${tone.text}`}>{preview.healthLabel}</p>
                  </div>
                  <p className="numeric text-[28px] font-medium leading-none tracking-[-0.05em] text-ink">
                    {preview.healthScore}
                    <span className="ml-0.5 text-[11px] font-normal text-faint">/100</span>
                  </p>
                </div>
                <Progress
                  value={preview.healthScore}
                  className="mt-3"
                  indicatorClassName={tone.bg}
                  label="Preview financial health score"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Free cash flow</p>
                  <p className={preview.freeCashFlow < 0 ? 'numeric mt-1.5 text-[13px] font-medium text-rose' : 'numeric mt-1.5 text-[13px] font-medium text-ink'}>
                    {formatCurrency(preview.freeCashFlow)}
                  </p>
                  <p className="mt-1 text-[9px] text-faint">{formatPercent(preview.savingsRatePct, 1)} of income</p>
                </div>
                <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Emergency cover</p>
                  <p className="numeric mt-1.5 text-[13px] font-medium text-ink">
                    {preview.coverageMonths.toFixed(1)} mo
                  </p>
                  <p className="mt-1 text-[9px] text-faint">of essential expenses</p>
                </div>
                <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Safe to spend</p>
                  <p className="numeric mt-1.5 text-[13px] font-medium text-ink">{formatCurrency(preview.safeToSpend)}</p>
                  <p className="mt-1 text-[9px] text-faint">above the reserve</p>
                </div>
                <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-faint">Debt to income</p>
                  <p className="numeric mt-1.5 text-[13px] font-medium text-ink">
                    {formatPercent(preview.debtToIncomePct, 1)}
                  </p>
                  <p className="mt-1 text-[9px] text-faint">existing debt only</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[9px]">
                  <span className="flex items-center gap-1.5 text-muted">
                    <ShieldCheck className="h-3 w-3 text-emerald-300" aria-hidden="true" />
                    Reserve funded
                  </span>
                  <span className="numeric text-ink">{formatPercent(reservePct, 0)}</span>
                </div>
                <Progress value={reservePct} label="Emergency fund progress" />
                <div className="mt-2 flex items-center justify-between text-[9px]">
                  <span className="text-faint">{formatCurrency(numbers.current_savings)} saved</span>
                  <span className={preview.emergencyGap > 0 ? 'text-amber' : 'text-emerald-300'}>
                    {preview.emergencyGap > 0
                      ? `${formatCurrency(preview.emergencyGap)} to go`
                      : 'Target fully covered'}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[9px]">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Target className="h-3 w-3 text-sky" aria-hidden="true" />
                    Purchase readiness
                  </span>
                  <span className="numeric text-ink">{formatPercent(preview.readinessPct, 0)}</span>
                </div>
                <Progress
                  value={preview.readinessPct}
                  label="Purchase readiness progress"
                  indicatorClassName="bg-sky"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[9px]">
                  <span className="text-faint">
                    {preview.monthsToPurchase === 0
                      ? 'Fits inside safe-to-spend now'
                      : preview.monthsToPurchase === null
                        ? 'Cash flow needs attention'
                        : `About ${preview.monthsToPurchase} month${preview.monthsToPurchase === 1 ? '' : 's'} at this pace`}
                  </span>
                  {projectedDate && preview.monthsToPurchase !== null && preview.monthsToPurchase > 0 && (
                    <span className="text-muted">{formatDate(projectedDate, 'monthYear')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 rounded-xl border border-line/60 bg-white/[0.015] p-3">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
                <p className="text-[9px] leading-relaxed text-faint">
                  The preview mirrors the backend scoring model. Saving updates every chart, simulation default and
                  affordability check.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-faint" aria-hidden="true" />
                Workspace data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-faint">Profile updated</span>
                <span className="text-muted">{formatDate(profile.updated_at, 'medium')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Storage</span>
                <span className="text-muted">Local SQLite · demo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Currency</span>
                <span className="text-muted">Indian rupee (INR)</span>
              </div>
              <div className="border-t border-line/60 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setRestoreOpen(true)}
                  disabled={saving || restoring}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Restore demo profile
                </Button>
                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-faint">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  Only profile values are reset. Installments, saved plans and past simulations remain.
                </p>
              </div>
            </CardContent>
          </Card>

          <a
            href="https://www.rbi.org.in/financialeducation"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl border border-line/60 bg-white/[0.015] px-4 py-3 text-[9px] text-faint transition-colors hover:border-line hover:text-muted"
          >
            Learn the basics of personal finance
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </aside>
      </div>

      <p className="px-1 pt-1 text-[9px] leading-relaxed text-faint/80">
        This app runs entirely on your machine. No data leaves the local database. Projections are illustrative and do
        not account for investment returns, inflation or tax.
      </p>

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore the demo profile?"
        description="This replaces your income, spending, savings and purchase values with the original demo profile. Tracked installments, purchase plans and simulations are preserved."
        confirmLabel="Restore demo data"
        onConfirm={() => void handleRestore()}
        loading={restoring}
      >
        <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
          <p className="text-[9px] leading-relaxed text-faint">
            Demo profile: Aarav Mehta · ₹82,000 monthly income · ₹2,20,000 savings · ₹1,80,000 emergency target.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[9px] text-amber">
            <Info className="h-3 w-3" aria-hidden="true" />
            You can still cancel before anything changes.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
