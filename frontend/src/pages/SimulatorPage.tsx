import { BookOpen, GitFork, Info, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Callout } from '@/components/common/Callout'
import { PageHeader } from '@/components/common/PageHeader'
import { FuturesChart } from '@/components/simulator/FuturesChart'
import { RecommendationBanner } from '@/components/simulator/RecommendationBanner'
import { ScenarioCard } from '@/components/simulator/ScenarioCard'
import { ScenarioDetailDialog } from '@/components/simulator/ScenarioDetailDialog'
import { SimulationSetup } from '@/components/simulator/SimulationSetup'
import { StressLab } from '@/components/simulator/StressLab'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { api, getApiErrorMessage } from '@/lib/api'
import { useApp } from '@/lib/app-context'
import type { Profile, Scenario, SimulationInput, SimulationResult } from '@/types/api'
import { formatCurrency } from '@/lib/utils'

function makeDefaults(profile: Profile): SimulationInput {
  const purchase = profile.planned_purchase_amount > 0 ? profile.planned_purchase_amount : 70000
  return {
    horizon_months: 12,
    purchase_amount: purchase,
    wait_months: Math.min(2, 12),
    cheaper_price: Math.round(purchase * 0.8),
    emi_down_payment_pct: 20,
    emi_annual_rate_pct: 13.5,
    emi_tenure_months: 12,
    unexpected_expense_amount: 35000,
    unexpected_expense_month: 4,
    delayed_salary_months: 1,
    spending_increase_pct: 12,
  }
}

export function SimulatorPage() {
  const { profile } = useApp()
  const [input, setInput] = useState<SimulationInput>(() => (profile ? makeDefaults(profile) : {
    horizon_months: 12,
    purchase_amount: 70000,
    wait_months: 2,
    cheaper_price: 56000,
    emi_down_payment_pct: 20,
    emi_annual_rate_pct: 13.5,
    emi_tenure_months: 12,
    unexpected_expense_amount: 35000,
    unexpected_expense_month: 4,
    delayed_salary_months: 1,
    spending_increase_pct: 12,
  }))
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const started = useRef(false)

  const runConfig = useCallback(async (config: SimulationInput) => {
    if (!Number.isFinite(config.purchase_amount) || config.purchase_amount <= 0) {
      setError('Enter a purchase amount greater than zero.')
      return
    }
    setLoading(true)
    setError(null)
    setSelectedScenario(null)
    try {
      const response = await api.simulate({
        ...config,
        horizon_months: Math.max(1, config.horizon_months),
        purchase_amount: Math.round(config.purchase_amount * 100) / 100,
        wait_months: Math.min(Math.max(1, config.wait_months), config.horizon_months),
        unexpected_expense_month: Math.min(Math.max(1, config.unexpected_expense_month), config.horizon_months),
        title: 'Parallel futures analysis',
      })
      setResult(response)
    } catch (caught) {
      setError(getApiErrorMessage(caught))
      toast.error(getApiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile && !started.current) {
      started.current = true
      const defaults = makeDefaults(profile)
      setInput(defaults)
      void runConfig(defaults)
    }
  }, [profile, runConfig])

  if (!profile) return null

  const handleFieldChange = (key: keyof SimulationInput, value: number) => {
    setInput((current) => {
      const next = { ...current, [key]: value }
      if (key === 'horizon_months') {
        next.wait_months = Math.min(Math.max(1, next.wait_months), value)
        next.unexpected_expense_month = Math.min(Math.max(1, next.unexpected_expense_month), value)
      }
      return next
    })
  }

  const handleApplyAdvanced = (next: SimulationInput) => {
    setInput(next)
    void runConfig(next)
  }

  const handleReset = () => {
    const next = makeDefaults(profile)
    setInput(next)
    void runConfig(next)
    toast.success('Simulation reset to your profile assumptions.')
  }

  const purchaseScenarios = result?.scenarios.filter((scenario) => !scenario.is_baseline) ?? []
  const recommendedScenario = result?.scenarios.find(
    (scenario) => scenario.id === result.recommendation.scenario_id,
  )

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow="Decision simulator"
        title="Parallel Futures"
        description="One purchase, several possible paths. Compare liquidity, savings and resilience before you decide."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setMethodOpen(true)}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            How it works
          </Button>
        }
      />

      <SimulationSetup
        input={input}
        onChange={handleFieldChange}
        onRun={() => void runConfig(input)}
        onApplyAdvanced={handleApplyAdvanced}
        onReset={handleReset}
        loading={loading}
        error={error}
        advancedOpen={advancedOpen}
        onAdvancedOpenChange={setAdvancedOpen}
      />

      {!result && loading && (
        <div className="space-y-4" aria-label="Building parallel futures">
          <Skeleton className="h-[118px] rounded-2xl" />
          <Skeleton className="h-[470px] rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-[285px] rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {!result && !loading && error && (
        <Callout tone="danger" title="The futures could not be built">
          {error}. Check your assumptions and try again.
        </Callout>
      )}

      {result && (
        <div className={`space-y-5 transition-opacity ${loading ? 'pointer-events-none opacity-60' : 'opacity-100'}`} aria-busy={loading}>
          <RecommendationBanner recommendation={result.recommendation} scenario={recommendedScenario} />

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] text-faint">
              <GitFork className="h-3 w-3 text-emerald-300" aria-hidden="true" />
              {result.scenarios.length - 1} purchase routes · {result.horizon_months}-month horizon ·{' '}
              {formatCurrency(result.purchase_amount)} decision
            </span>
            {loading && (
              <span className="flex items-center gap-1.5 text-[9px] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Rebuilding futures…
              </span>
            )}
          </div>

          <FuturesChart
            scenarios={result.scenarios}
            emergencyTarget={profile.emergency_fund_target}
            recommendedId={result.recommendation.scenario_id}
          />

          <section aria-labelledby="scenario-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow">Five ways forward</p>
                <h2 id="scenario-heading" className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                  Choose a future to inspect
                </h2>
              </div>
              <span className="flex items-center gap-1 text-[9px] text-faint">
                <Info className="h-3 w-3" aria-hidden="true" /> Tap a card for the full maths
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {purchaseScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  recommended={scenario.id === result.recommendation.scenario_id}
                  onView={setSelectedScenario}
                />
              ))}
            </div>
          </section>

          <StressLab
            tests={result.stress_tests}
            assumptions={result.assumptions}
            onEdit={() => setAdvancedOpen(true)}
          />

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-line/60 bg-white/[0.015] px-4 py-3 sm:flex-row sm:items-center">
            <p className="flex items-start gap-2 text-[9px] leading-relaxed text-faint">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/70" aria-hidden="true" />
              Your emergency fund is treated as protected money. Safe-to-spend only includes savings above that target.
            </p>
            <span className="flex shrink-0 items-center gap-1 text-[9px] text-faint">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Deterministic · no paid data
            </span>
          </div>
        </div>
      )}

      <ScenarioDetailDialog scenario={selectedScenario} onClose={() => setSelectedScenario(null)} />
      <MethodologyDialog open={methodOpen} onOpenChange={setMethodOpen} />
    </div>
  )
}

function MethodologyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const steps = [
    {
      title: 'Start with your real numbers',
      body: 'We use your income, essential costs, lifestyle spend, existing debt and current savings. The emergency fund target is ring-fenced.',
    },
    {
      title: 'Run each decision forward',
      body: 'Every route is projected month by month with no investment returns credited. Buying now changes your starting balance; waiting buys later.',
    },
    {
      title: 'Stress the buy-now route',
      body: 'Salary delays are eventually paid in full. Unexpected costs, higher spending and combinations of shocks reveal where a reserve gets stretched.',
    },
    {
      title: 'Compare resilience, not just cost',
      body: 'Ending savings, the lowest reserve point, monthly commitments and interest all feed the risk read. The lowest-risk route is marked as best fit.',
    },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>How the parallel futures work</DialogTitle>
          <DialogDescription>
            A transparent, deterministic model you can reason about — not a black box and not financial advice.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] font-mono text-[9px] text-emerald-300">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{step.body}</p>
              </div>
            </div>
          ))}
          <Callout tone="info" className="mt-2">
            Projections are illustrative. This demo uses fictional data and never connects to a bank account.
          </Callout>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
