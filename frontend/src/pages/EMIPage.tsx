import { ArrowUpRight, ReceiptText } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Callout } from '@/components/common/Callout'
import { PageHeader } from '@/components/common/PageHeader'
import { EMIForm, type EMIFormValue } from '@/components/emi/EMIForm'
import { EMIResultPanel } from '@/components/emi/EMIResultPanel'
import { SaveInstallmentDialog, type TrackerSaveDetails } from '@/components/emi/SaveInstallmentDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getApiErrorMessage } from '@/lib/api'
import { useApp } from '@/lib/app-context'
import type { EMIResult } from '@/types/api'

interface AppliedQuote {
  purchasePrice: number
  downPayment: number
}

export function EMIPage() {
  const { profile, refresh } = useApp()
  const [form, setForm] = useState<EMIFormValue>(() => {
    const price = profile?.planned_purchase_amount && profile.planned_purchase_amount > 0
      ? profile.planned_purchase_amount
      : 70000
    return {
      purchasePrice: price,
      downPayment: Math.round(price * 0.2),
      annualRate: 13.5,
      tenureMonths: 12,
      processingFeePct: 0,
      processingFeeFixed: 0,
    }
  })
  const [result, setResult] = useState<EMIResult | null>(null)
  const [quote, setQuote] = useState<AppliedQuote | null>(null)
  const [calculating, setCalculating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const started = useRef(false)
  const requestSequence = useRef(0)

  const calculate = useCallback(
    async (value: EMIFormValue, options: { silent?: boolean } = {}) => {
      const principal = value.purchasePrice - value.downPayment
      if (value.purchasePrice <= 0 || principal <= 0) return
      const sequence = ++requestSequence.current
      setCalculating(true)
      setError(null)
      try {
        const response = await api.calculateEMI({
          principal,
          annual_rate_pct: value.annualRate,
          tenure_months: value.tenureMonths,
          processing_fee_pct: value.processingFeePct,
          processing_fee_fixed: value.processingFeeFixed,
        })
        if (sequence !== requestSequence.current) return
        setResult(response)
        setQuote({ purchasePrice: value.purchasePrice, downPayment: value.downPayment })
      } catch (caught) {
        if (sequence !== requestSequence.current) return
        const message = getApiErrorMessage(caught)
        setError(message)
        if (!options.silent) toast.error(message)
      } finally {
        if (sequence === requestSequence.current) {
          setCalculating(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (!profile) return
    if (!started.current) {
      started.current = true
      void calculate(form)
      return
    }
    if (form.purchasePrice <= 0 || form.downPayment >= form.purchasePrice) return
    const timer = window.setTimeout(() => {
      void calculate(form, { silent: true })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [calculate, form, profile])

  if (!profile) return null

  const handleSave = async (details: TrackerSaveDetails) => {
    if (!result || !quote) return
    setSaving(true)
    try {
      await api.createInstallment({
        name: details.name,
        merchant: details.merchant,
        total_amount: quote.purchasePrice,
        upfront_payment: quote.downPayment,
        monthly_installment: result.monthly_emi,
        tenure_months: result.tenure_months,
        paid_installments: 0,
        next_due_date: details.dueDate,
        annual_rate_pct: result.annual_rate_pct,
        notes: 'Created from the EMI calculator.',
      })
      setSaveOpen(false)
      toast.success('EMI plan added to your installment tracker.')
      await refresh()
    } catch (caught) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow="EMI calculator"
        title="Know the real cost of monthly."
        description="See the interest, fees and cash-flow impact before an EMI becomes a monthly habit."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/installments">
              <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
              Tracked installments
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {error && (
        <Callout tone="danger" title="The calculation did not refresh">
          {error}
        </Callout>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.55fr)] xl:gap-5">
        <EMIForm
          value={form}
          profile={profile}
          loading={calculating && !result}
          onChange={setForm}
          onSubmit={() => void calculate(form)}
        />

        <div>
          {!result && calculating ? (
            <div className="space-y-4" aria-label="Calculating EMI">
              <Skeleton className="h-[430px] rounded-2xl" />
              <Skeleton className="h-[410px] rounded-2xl" />
            </div>
          ) : result && quote ? (
            <EMIResultPanel
              result={result}
              purchasePrice={quote.purchasePrice}
              downPayment={quote.downPayment}
              updating={calculating}
              onSave={() => setSaveOpen(true)}
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-line bg-surface/80 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-ink">Enter valid EMI terms</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                  The down payment must be less than the purchase price to calculate a financed amount.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="px-1 text-[9px] leading-relaxed text-faint/80">
        EMI estimates use the reducing-balance method. Processing fees are shown separately. This is an illustrative
        calculator, not a lending offer.
      </p>

      <SaveInstallmentDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        result={result}
        purchasePrice={quote?.purchasePrice ?? 0}
        downPayment={quote?.downPayment ?? 0}
        saving={saving}
        onSave={(details) => void handleSave(details)}
      />
    </div>
  )
}
