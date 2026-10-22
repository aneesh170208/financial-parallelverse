import { Info, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldHint, Input, Label, Select } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SimulationInput } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

interface SimulationSetupProps {
  input: SimulationInput
  onChange: (key: keyof SimulationInput, value: number) => void
  onRun: () => void
  onApplyAdvanced: (next: SimulationInput) => void
  onReset: () => void
  loading: boolean
  error: string | null
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
}

export function SimulationSetup({
  input,
  onChange,
  onRun,
  onApplyAdvanced,
  onReset,
  loading,
  error,
  advancedOpen,
  onAdvancedOpenChange,
}: SimulationSetupProps) {
  return (
    <Card className="overflow-visible">
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          onRun()
        }}
      >
        <div className="flex flex-col gap-4 border-b border-line/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">Shape the decision</p>
              <p className="mt-0.5 text-[10px] text-muted">Adjust the purchase and see every path update.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-md border border-line/70 bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.11em] text-faint">
                Deterministic
              </span>
              <span className="rounded-md border border-line/70 bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.11em] text-faint">
                0% return assumed
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onReset} aria-label="Reset simulation assumptions">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to your profile defaults</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(170px,1.2fr)_150px_130px_auto] lg:items-end">
            <div>
              <Label htmlFor="purchase-amount">Purchase amount</Label>
              <Input
                id="purchase-amount"
                type="number"
                min={0}
                step="any"
                leading="₹"
                value={input.purchase_amount || ''}
                onChange={(event) => onChange('purchase_amount', Number(event.target.value))}
                aria-describedby="purchase-amount-hint"
              />
              <FieldHint id="purchase-amount-hint">The full price you are considering.</FieldHint>
            </div>
            <div>
              <Label htmlFor="horizon-months">Time horizon</Label>
              <Select
                id="horizon-months"
                value={input.horizon_months}
                onChange={(event) => onChange('horizon_months', Number(event.target.value))}
              >
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
              </Select>
              <FieldHint>How far each future runs.</FieldHint>
            </div>
            <div>
              <Label htmlFor="wait-months">Wait period</Label>
              <Select
                id="wait-months"
                value={input.wait_months}
                onChange={(event) => onChange('wait_months', Number(event.target.value))}
              >
                {Array.from({ length: Math.min(12, input.horizon_months) }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>
                    {month} month{month === 1 ? '' : 's'}
                  </option>
                ))}
              </Select>
              <FieldHint>For the wait & save path.</FieldHint>
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:pb-[22px]">
              <Button type="button" variant="secondary" onClick={() => onAdvancedOpenChange(true)}>
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Assumptions
              </Button>
              <Button type="submit" loading={loading}>
                Run 5 futures
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-3.5">
            <span className="flex items-center gap-1.5 text-[9px] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {formatCurrency(input.purchase_amount)} planned purchase
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" />
              EMI from {input.emi_down_payment_pct}% down
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              {formatCurrency(input.unexpected_expense_amount)} curveball
            </span>
            <button
              type="button"
              onClick={() => onAdvancedOpenChange(true)}
              className="ml-auto flex items-center gap-1 text-[9px] font-medium text-muted hover:text-ink"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
              Edit stress assumptions
            </button>
          </div>

          {error && <p className="mt-3 text-[11px] text-rose" role="alert">{error}</p>}
        </div>
      </form>

      <AdvancedAssumptionsDialog
        open={advancedOpen}
        onOpenChange={onAdvancedOpenChange}
        input={input}
        onApply={onApplyAdvanced}
      />
    </Card>
  )
}

function AdvancedAssumptionsDialog({
  open,
  onOpenChange,
  input,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  input: SimulationInput
  onApply: (next: SimulationInput) => void
}) {
  const [draft, setDraft] = useState<SimulationInput>(input)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(input)
      setError(null)
    }
  }, [open, input])

  const update = (key: keyof SimulationInput, value: number) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.cheaper_price > draft.purchase_amount) {
      setError('The lighter alternative should cost less than the full purchase.')
      return
    }
    if (draft.emi_down_payment_pct >= 100) {
      setError('Choose a down payment below 100%.')
      return
    }
    if (draft.unexpected_expense_month > draft.horizon_months) {
      setError('Choose an unexpected expense month inside the simulation horizon.')
      return
    }
    onOpenChange(false)
    onApply(draft)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Simulation assumptions</DialogTitle>
            <DialogDescription>
              These inputs shape the lighter purchase, the EMI path and the stress lab. The primary outcomes update
              when you run the futures.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-sky">Lighter alternative</span>
                <span className="h-px flex-1 bg-line/70" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cheaper-price">Alternative price</Label>
                  <Input
                    id="cheaper-price"
                    type="number"
                    min={0}
                    step="any"
                    leading="₹"
                    value={draft.cheaper_price || ''}
                    onChange={(event) => update('cheaper_price', Number(event.target.value))}
                  />
                  <FieldHint>A similar model at a lower price.</FieldHint>
                </div>
                <div>
                  <Label htmlFor="advanced-wait">Wait period</Label>
                  <Input
                    id="advanced-wait"
                    type="number"
                    min={1}
                    max={12}
                    value={draft.wait_months}
                    onChange={(event) => update('wait_months', Number(event.target.value))}
                  />
                  <FieldHint>Months before the planned purchase.</FieldHint>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-violet">EMI structure</span>
                <span className="h-px flex-1 bg-line/70" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="emi-down">Down payment</Label>
                  <Input
                    id="emi-down"
                    type="number"
                    min={0}
                    max={90}
                    step="any"
                    trailing="%"
                    value={draft.emi_down_payment_pct}
                    onChange={(event) => update('emi_down_payment_pct', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="emi-rate">Annual rate</Label>
                  <Input
                    id="emi-rate"
                    type="number"
                    min={0}
                    max={60}
                    step="any"
                    trailing="%"
                    value={draft.emi_annual_rate_pct}
                    onChange={(event) => update('emi_annual_rate_pct', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="emi-tenure">Tenure</Label>
                  <Select
                    id="emi-tenure"
                    value={draft.emi_tenure_months}
                    onChange={(event) => update('emi_tenure_months', Number(event.target.value))}
                  >
                    {[3, 6, 9, 12, 18, 24, 36].map((month) => (
                      <option key={month} value={month}>{month} months</option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rose">Stress lab</span>
                <span className="h-px flex-1 bg-line/70" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shock-amount">Unexpected expense</Label>
                  <Input
                    id="shock-amount"
                    type="number"
                    min={0}
                    step="any"
                    leading="₹"
                    value={draft.unexpected_expense_amount || ''}
                    onChange={(event) => update('unexpected_expense_amount', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="shock-month">Surprise lands in month</Label>
                  <Input
                    id="shock-month"
                    type="number"
                    min={1}
                    max={draft.horizon_months}
                    value={draft.unexpected_expense_month}
                    onChange={(event) => update('unexpected_expense_month', Number(event.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="salary-delay">Salary delay</Label>
                  <Select
                    id="salary-delay"
                    value={draft.delayed_salary_months}
                    onChange={(event) => update('delayed_salary_months', Number(event.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((month) => (
                      <option key={month} value={month}>{month} month{month === 1 ? '' : 's'}</option>
                    ))}
                  </Select>
                  <FieldHint>Paid in full once the delay ends.</FieldHint>
                </div>
                <div>
                  <Label htmlFor="spending-rise">Spending increase</Label>
                  <Input
                    id="spending-rise"
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    trailing="%"
                    value={draft.spending_increase_pct}
                    onChange={(event) => update('spending_increase_pct', Number(event.target.value))}
                  />
                  <FieldHint>Applied to essentials and lifestyle spend.</FieldHint>
                </div>
              </div>
            </section>
            {error && <p className="text-[11px] text-rose" role="alert">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply & run</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
