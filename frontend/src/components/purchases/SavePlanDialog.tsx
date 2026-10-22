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
import type { PurchaseAssessment } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface SavedPlanInput {
  title: string
  notes: string
  monthlySaving: number
}

export function SavePlanDialog({
  open,
  onOpenChange,
  assessment,
  defaultTitle,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: PurchaseAssessment
  defaultTitle: string
  saving: boolean
  onSave: (input: SavedPlanInput) => void
}) {
  const [title, setTitle] = useState(defaultTitle)
  const [notes, setNotes] = useState('')
  const [monthlySaving, setMonthlySaving] = useState(assessment.recommended_monthly_saving)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle)
      setNotes('')
      setMonthlySaving(assessment.recommended_monthly_saving)
      setError(null)
    }
  }, [open, assessment.recommended_monthly_saving, defaultTitle])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('Give the saved plan a name.')
      return
    }
    onSave({ title: title.trim(), notes: notes.trim(), monthlySaving })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Save this purchase plan</DialogTitle>
            <DialogDescription>
              Keep the target, pace and notes together. Your financial profile will use these values for future
              simulations.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="saved-plan-title">Plan name</Label>
              <Input
                id="saved-plan-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                invalid={!!error}
              />
              {error && <FieldError>{error}</FieldError>}
            </div>
            <div>
              <Label htmlFor="saved-monthly">Monthly set-aside</Label>
              <Input
                id="saved-monthly"
                type="number"
                min={0}
                step="any"
                leading="₹"
                value={monthlySaving || ''}
                onChange={(event) => setMonthlySaving(Number(event.target.value))}
              />
              <FieldHint>
                Recommended {formatCurrency(assessment.recommended_monthly_saving)} based on the gap and target date.
              </FieldHint>
            </div>
            <div>
              <Label htmlFor="saved-notes">Notes <span className="font-normal text-faint">(optional)</span></Label>
              <Textarea
                id="saved-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What would make this plan worth prioritising?"
                maxLength={1000}
              />
            </div>
            <div className="rounded-xl border border-line/70 bg-[#09121E]/60 p-3.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-faint">Target purchase</span>
                <span className="numeric text-ink">{formatCurrency(assessment.amount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-faint">Target date</span>
                <span className="text-ink">{formatDate(assessment.target_date, 'medium')}</span>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
