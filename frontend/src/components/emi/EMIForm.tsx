import { ArrowRight, Calculator, Info } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FieldError, FieldHint, Input, Label, Select } from '@/components/ui/input'
import type { Profile } from '@/types/api'
import { formatCurrency, formatPercent } from '@/lib/utils'

export interface EMIFormValue {
  purchasePrice: number
  downPayment: number
  annualRate: number
  tenureMonths: number
  processingFeePct: number
  processingFeeFixed: number
}

interface EMIFormProps {
  value: EMIFormValue
  profile: Profile
  loading: boolean
  onChange: (value: EMIFormValue) => void
  onSubmit: () => void
}

export function EMIForm({ value, profile, loading, onChange, onSubmit }: EMIFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const financed = Math.max(0, value.purchasePrice - value.downPayment)
  const downPct = value.purchasePrice > 0 ? (value.downPayment / value.purchasePrice) * 100 : 0

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!value.purchasePrice || value.purchasePrice <= 0) next.purchasePrice = 'Enter a purchase price above zero.'
    if (value.downPayment < 0) next.downPayment = 'Down payment cannot be negative.'
    if (value.downPayment >= value.purchasePrice && value.purchasePrice > 0) {
      next.downPayment = 'Down payment must be less than the purchase price.'
    }
    if (!value.tenureMonths) next.tenureMonths = 'Choose a tenure.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSubmit()
  }

  return (
    <Card className="h-fit lg:sticky lg:top-[86px]">
      <CardHeader className="border-b border-line/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-[#09121E] text-violet">
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">EMI assumptions</h2>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          The calculator updates quietly as you type. Nothing is saved until you choose to track it.
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="emi-price">Purchase price</Label>
            <Input
              id="emi-price"
              type="number"
              min={0}
              step="any"
              leading="₹"
              value={value.purchasePrice || ''}
              onChange={(event) => onChange({ ...value, purchasePrice: Number(event.target.value) })}
              invalid={!!errors.purchasePrice}
            />
            {errors.purchasePrice && <FieldError>{errors.purchasePrice}</FieldError>}
          </div>
          <div>
            <Label htmlFor="emi-down">Down payment</Label>
            <Input
              id="emi-down"
              type="number"
              min={0}
              step="any"
              leading="₹"
              value={value.downPayment || ''}
              onChange={(event) => onChange({ ...value, downPayment: Number(event.target.value) })}
              invalid={!!errors.downPayment}
            />
            {errors.downPayment ? (
              <FieldError>{errors.downPayment}</FieldError>
            ) : (
              <FieldHint>{formatPercent(downPct, 1)} of the purchase price</FieldHint>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emi-rate">Annual interest</Label>
              <Input
                id="emi-rate"
                type="number"
                min={0}
                max={60}
                step="any"
                trailing="%"
                value={value.annualRate}
                onChange={(event) => onChange({ ...value, annualRate: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="emi-tenure">Tenure</Label>
              <Select
                id="emi-tenure"
                value={value.tenureMonths}
                onChange={(event) => onChange({ ...value, tenureMonths: Number(event.target.value) })}
              >
                {[3, 6, 9, 12, 18, 24, 36].map((month) => (
                  <option key={month} value={month}>{month} months</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emi-fee-pct">Processing fee</Label>
              <Input
                id="emi-fee-pct"
                type="number"
                min={0}
                max={10}
                step="any"
                trailing="%"
                value={value.processingFeePct}
                onChange={(event) => onChange({ ...value, processingFeePct: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="emi-fee-fixed">Fixed fee</Label>
              <Input
                id="emi-fee-fixed"
                type="number"
                min={0}
                step="any"
                leading="₹"
                value={value.processingFeeFixed || ''}
                onChange={(event) => onChange({ ...value, processingFeeFixed: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-faint">Amount financed</span>
              <span className="numeric text-[13px] font-medium text-ink">{formatCurrency(financed)}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-violet/80"
                style={{ width: `${Math.min(100, Math.max(0, 100 - downPct))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-faint">
              <span>{formatCurrency(value.downPayment)} upfront</span>
              <span>{formatCurrency(financed)} borrowed</span>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Calculate EMI
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-line/60 bg-white/[0.015] p-3 text-[9px] leading-relaxed text-faint">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          Your income is {formatCurrency(profile.monthly_income)}/month with {formatCurrency(profile.monthly_free_cash_flow)} free before a new EMI.
        </div>
      </CardContent>
    </Card>
  )
}
