import { AlertCircle, ArrowRight, BookmarkCheck, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FieldError, FieldHint, Input, Label } from '@/components/ui/input'
import type { Profile, PurchasePlan } from '@/types/api'
import { formatCurrency, toDateInput } from '@/lib/utils'

export interface PurchaseFormValue {
  title: string
  amount: number
  target_date: string
}

interface PurchaseFormProps {
  value: PurchaseFormValue
  onChange: (value: PurchaseFormValue) => void
  onSubmit: () => void
  onDeleteSavedPlan: () => void
  loading: boolean
  profile: Profile
  activePlan: PurchasePlan | null
}

export function PurchaseForm({
  value,
  onChange,
  onSubmit,
  onDeleteSavedPlan,
  loading,
  profile,
  activePlan,
}: PurchaseFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!value.title.trim()) next.title = 'Give this plan a short name.'
    if (!value.amount || value.amount <= 0) next.amount = 'Enter a purchase amount above zero.'
    if (!value.target_date) next.target_date = 'Choose a target date.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSubmit()
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-[#09121E] text-sand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Plan a purchase</h2>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          We will only count savings above your protected emergency fund.
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan-title">What are you planning?</Label>
            <Input
              id="plan-title"
              value={value.title}
              onChange={(event) => onChange({ ...value, title: event.target.value })}
              invalid={!!errors.title}
              placeholder="New laptop for work"
            />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </div>
          <div>
            <Label htmlFor="plan-amount">Purchase amount</Label>
            <Input
              id="plan-amount"
              type="number"
              min={0}
              step="any"
              leading="₹"
              value={value.amount || ''}
              onChange={(event) => onChange({ ...value, amount: Number(event.target.value) })}
              invalid={!!errors.amount}
            />
            {errors.amount ? <FieldError>{errors.amount}</FieldError> : <FieldHint>Include the full price you expect to pay.</FieldHint>}
          </div>
          <div>
            <Label htmlFor="plan-date">Target date</Label>
            <Input
              id="plan-date"
              type="date"
              min={toDateInput(new Date())}
              value={value.target_date}
              onChange={(event) => onChange({ ...value, target_date: event.target.value })}
              invalid={!!errors.target_date}
            />
            {errors.target_date ? <FieldError>{errors.target_date}</FieldError> : <FieldHint>An honest date is more useful than an optimistic one.</FieldHint>}
          </div>

          <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-faint">Monthly capacity</span>
              <span className="numeric text-ink">{formatCurrency(profile.monthly_free_cash_flow)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-faint">Protected reserve</span>
              <span className="numeric text-ink">{formatCurrency(profile.emergency_fund_target)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Analyze this plan
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </form>

        {activePlan && (
          <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3">
            <div className="flex items-start gap-2">
              <BookmarkCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-ink">Saved plan active</p>
                <p className="mt-0.5 truncate text-[9px] text-faint">
                  {activePlan.title} · {formatCurrency(activePlan.amount)} ·{' '}
                  {formatCurrency(activePlan.monthly_saving_plan)}/mo
                </p>
              </div>
              <button
                type="button"
                onClick={onDeleteSavedPlan}
                aria-label="Delete saved purchase plan"
                className="text-faint transition-colors hover:text-rose"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 text-[9px] leading-relaxed text-faint">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Saving a plan updates your planned purchase amount and target date on your profile.
        </div>
      </CardContent>
    </Card>
  )
}
