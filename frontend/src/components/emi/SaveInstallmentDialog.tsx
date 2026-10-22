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
import { FieldError, FieldHint, Input, Label } from '@/components/ui/input'
import type { EMIResult } from '@/types/api'
import { addMonths, formatCurrency, formatDate, toDateInput } from '@/lib/utils'

export interface TrackerSaveDetails {
  name: string
  merchant: string
  dueDate: string
}

export function SaveInstallmentDialog({
  open,
  onOpenChange,
  result,
  purchasePrice,
  downPayment,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: EMIResult | null
  purchasePrice: number
  downPayment: number
  saving: boolean
  onSave: (details: TrackerSaveDetails) => void
}) {
  const [name, setName] = useState('')
  const [merchant, setMerchant] = useState('')
  const [dueDate, setDueDate] = useState(toDateInput(addMonths(new Date(), 1)))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setMerchant('')
      setDueDate(toDateInput(addMonths(new Date(), 1)))
      setError(null)
    }
  }, [open])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give this installment a name.')
      return
    }
    if (!dueDate) {
      setError('Choose the first due date.')
      return
    }
    onSave({ name: name.trim(), merchant: merchant.trim(), dueDate })
  }

  if (!result) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save to the installment tracker</DialogTitle>
            <DialogDescription>
              This creates a tracked plan with your EMI assumptions. You can mark payments as you make them.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="tracker-name">Purchase name</Label>
              <Input
                id="tracker-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
                placeholder="Laptop for work"
                invalid={!!error}
              />
              {error && <FieldError>{error}</FieldError>}
            </div>
            <div>
              <Label htmlFor="tracker-merchant">Merchant <span className="font-normal text-faint">(optional)</span></Label>
              <Input
                id="tracker-merchant"
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
                placeholder="Croma"
              />
            </div>
            <div>
              <Label htmlFor="tracker-due">First payment due</Label>
              <Input
                id="tracker-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <FieldHint>Reminders appear here before each due date.</FieldHint>
            </div>
            <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-faint">Monthly installment</span>
                <span className="numeric text-[16px] font-medium text-ink">{formatCurrency(result.monthly_emi, { decimals: true })}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-faint">Remaining tenure</span>
                <span className="text-muted">{result.tenure_months} months</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-faint">Purchase / down payment</span>
                <span className="numeric text-muted">{formatCurrency(purchasePrice)} / {formatCurrency(downPayment)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-faint">First due</span>
                <span className="text-muted">{formatDate(dueDate, 'medium')}</span>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Track this plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
