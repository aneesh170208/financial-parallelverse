import { CalendarPlus, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError, FieldHint, Input, Label, Textarea } from '@/components/ui/input'
import type { InstallmentInput } from '@/types/api'
import { addMonths, formatCurrency, toDateInput } from '@/lib/utils'

interface Values {
  name: string
  merchant: string
  total: string
  upfront: string
  monthly: string
  tenure: string
  paid: string
  annualRate: string
  dueDate: string
  notes: string
}

function initialValues(): Values {
  return {
    name: '',
    merchant: '',
    total: '',
    upfront: '0',
    monthly: '',
    tenure: '6',
    paid: '0',
    annualRate: '0',
    dueDate: toDateInput(addMonths(new Date(), 1)),
    notes: '',
  }
}

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function AddInstallmentDialog({
  open,
  onOpenChange,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  onSave: (input: InstallmentInput) => void
}) {
  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [monthlyTouched, setMonthlyTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initialValues())
      setErrors({})
      setMonthlyTouched(false)
    }
  }, [open])

  const total = toNumber(values.total)
  const upfront = toNumber(values.upfront)
  const tenure = toNumber(values.tenure)
  const monthly = toNumber(values.monthly)
  const financed = total - upfront
  const scheduledTotal = monthly * tenure
  const extraCost = Math.max(0, scheduledTotal - financed)

  // Offer a neutral, no-cost monthly amount until the user edits the field.
  useEffect(() => {
    if (!open || monthlyTouched || financed <= 0 || tenure < 1) return
    setValues((current) => {
      const suggested = String(Math.ceil(financed / tenure))
      return current.monthly === suggested ? current : { ...current, monthly: suggested }
    })
  }, [financed, tenure, monthlyTouched, open])

  const update = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!values.name.trim()) next.name = 'Give this purchase a name.'
    if (values.name.trim().length > 100) next.name = 'Keep the name under 100 characters.'
    if (!values.total.trim() || !Number.isFinite(total) || total <= 0) {
      next.total = 'Enter a purchase total above zero.'
    }
    if (!values.upfront.trim() || !Number.isFinite(upfront) || upfront < 0) {
      next.upfront = 'Enter an upfront amount of zero or more.'
    } else if (upfront >= total && total > 0) {
      next.upfront = 'The upfront payment must be less than the total.'
    }
    if (!values.monthly.trim() || !Number.isFinite(monthly) || monthly <= 0) {
      next.monthly = 'Enter a monthly installment above zero.'
    }
    if (!Number.isInteger(tenure) || tenure < 1 || tenure > 120) {
      next.tenure = 'Tenure must be a whole number from 1 to 120.'
    }
    const paid = toNumber(values.paid)
    if (!Number.isInteger(paid) || paid < 0) {
      next.paid = 'Enter a whole number of paid installments.'
    } else if (Number.isInteger(tenure) && paid > tenure) {
      next.paid = 'Paid installments cannot exceed the tenure.'
    }
    const rate = toNumber(values.annualRate)
    if (!values.annualRate.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      next.annualRate = 'Enter a rate between 0% and 100%.'
    }
    if (!values.dueDate) next.dueDate = 'Choose the next due date.'
    if (values.notes.length > 1000) next.notes = 'Keep notes under 1,000 characters.'
    return next
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({
      name: values.name.trim(),
      merchant: values.merchant.trim(),
      total_amount: total,
      upfront_payment: upfront,
      monthly_installment: monthly,
      tenure_months: tenure,
      paid_installments: toNumber(values.paid),
      next_due_date: values.dueDate,
      annual_rate_pct: toNumber(values.annualRate),
      notes: values.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300">New tracked plan</span>
            </div>
            <DialogTitle>Add an installment plan</DialogTitle>
            <DialogDescription>
              Track a purchase you are already paying off. This is a local record — no bank connection is involved.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            <section>
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">The purchase</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="installment-name">Purchase name</Label>
                  <Input
                    id="installment-name"
                    value={values.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Laptop for work"
                    invalid={!!errors.name}
                    autoFocus
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-merchant">
                    Merchant <span className="font-normal text-faint">(optional)</span>
                  </Label>
                  <Input
                    id="installment-merchant"
                    value={values.merchant}
                    onChange={(event) => update('merchant', event.target.value)}
                    placeholder="Croma"
                  />
                </div>
                <div>
                  <Label htmlFor="installment-total">Purchase total</Label>
                  <Input
                    id="installment-total"
                    type="number"
                    min={0}
                    step="any"
                    leading="₹"
                    value={values.total}
                    onChange={(event) => update('total', event.target.value)}
                    invalid={!!errors.total}
                  />
                  {errors.total && <FieldError>{errors.total}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-upfront">Upfront payment</Label>
                  <Input
                    id="installment-upfront"
                    type="number"
                    min={0}
                    step="any"
                    leading="₹"
                    value={values.upfront}
                    onChange={(event) => update('upfront', event.target.value)}
                    invalid={!!errors.upfront}
                  />
                  {errors.upfront ? (
                    <FieldError>{errors.upfront}</FieldError>
                  ) : (
                    <FieldHint>Paid at checkout, before the installment schedule.</FieldHint>
                  )}
                </div>
              </div>
            </section>

            <section>
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">The schedule</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="installment-monthly">Monthly installment</Label>
                  <Input
                    id="installment-monthly"
                    type="number"
                    min={0}
                    step="any"
                    leading="₹"
                    value={values.monthly}
                    onChange={(event) => {
                      setMonthlyTouched(true)
                      update('monthly', event.target.value)
                    }}
                    invalid={!!errors.monthly}
                  />
                  {errors.monthly && <FieldError>{errors.monthly}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-tenure">Tenure</Label>
                  <Input
                    id="installment-tenure"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    trailing="mo"
                    value={values.tenure}
                    onChange={(event) => update('tenure', event.target.value)}
                    invalid={!!errors.tenure}
                  />
                  {errors.tenure && <FieldError>{errors.tenure}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-paid">Already paid</Label>
                  <Input
                    id="installment-paid"
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    trailing="mo"
                    value={values.paid}
                    onChange={(event) => update('paid', event.target.value)}
                    invalid={!!errors.paid}
                  />
                  {errors.paid && <FieldError>{errors.paid}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-due">Next due date</Label>
                  <Input
                    id="installment-due"
                    type="date"
                    value={values.dueDate}
                    onChange={(event) => update('dueDate', event.target.value)}
                    invalid={!!errors.dueDate}
                  />
                  {errors.dueDate && <FieldError>{errors.dueDate}</FieldError>}
                </div>
                <div>
                  <Label htmlFor="installment-rate">Annual interest</Label>
                  <Input
                    id="installment-rate"
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    trailing="%"
                    value={values.annualRate}
                    onChange={(event) => update('annualRate', event.target.value)}
                    invalid={!!errors.annualRate}
                  />
                  {errors.annualRate ? (
                    <FieldError>{errors.annualRate}</FieldError>
                  ) : (
                    <FieldHint>Use 0% for a no-cost EMI.</FieldHint>
                  )}
                </div>
                <div>
                  <Label htmlFor="installment-scheduled">Scheduled total</Label>
                  <div className="flex h-10 items-center rounded-xl border border-line/70 bg-[#09121E]/60 px-3">
                    <span className="numeric text-[13px] font-medium text-ink">
                      {formatCurrency(Number.isFinite(scheduledTotal) ? scheduledTotal : 0)}
                    </span>
                  </div>
                  <FieldHint>Monthly × tenure, excluding upfront.</FieldHint>
                </div>
              </div>
            </section>

            <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-4">
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[10px] text-faint">Financed amount</span>
                    <span className="numeric text-[15px] font-medium text-ink">
                      {formatCurrency(Math.max(0, financed))}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-[10px]">
                    <span className="text-faint">Cost above the financed amount</span>
                    <span className={extraCost > 0 ? 'numeric text-amber' : 'numeric text-emerald-300'}>
                      {extraCost > 0 ? formatCurrency(extraCost) : 'None'}
                    </span>
                  </div>
                  <p className="mt-2 text-[9px] leading-relaxed text-faint">
                    The suggested monthly amount is interest-free. Adjust it if your plan includes interest or fees.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="installment-notes">
                Notes <span className="font-normal text-faint">(optional)</span>
              </Label>
              <Textarea
                id="installment-notes"
                value={values.notes}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="No-cost EMI. Keep the payment buffer ready."
                maxLength={1000}
              />
              {errors.notes && <FieldError>{errors.notes}</FieldError>}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add to tracker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
