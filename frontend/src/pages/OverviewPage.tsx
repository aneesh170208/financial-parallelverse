import { ArrowRight, CalendarClock, GitFork, ShieldCheck, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { FinancialHealthCard } from '@/components/dashboard/FinancialHealthCard'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { NextDecisionCard } from '@/components/dashboard/NextDecisionCard'
import { RecentAnalysis } from '@/components/dashboard/RecentAnalysis'
import { SavingsProjectionChart } from '@/components/dashboard/SavingsProjectionChart'
import { UpcomingPaymentsCard } from '@/components/dashboard/UpcomingPaymentsCard'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  greeting,
} from '@/lib/utils'

export function OverviewPage() {
  const { dashboard, profile } = useApp()
  if (!dashboard || !profile) return null

  const emergencyTargetMonths =
    profile.essential_expenses > 0 ? profile.emergency_fund_target / profile.essential_expenses : 0
  const aboveTarget = profile.emergency_gap <= 0
  const plannedPurchase = dashboard.purchase

  return (
    <div className="page-container space-y-5">
      <PageHeader
        eyebrow={`${greeting()} · ${formatDate(new Date(), 'long')}`}
        title={`Your money, in parallel.`}
        description={`A calm view of ${profile.name.split(' ')[0]}'s finances — and the routes that keep the next decision safe.`}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to="/profile">Update profile</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/futures">
                <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                Run a simulation
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Financial snapshot">
        <MetricCard
          label="Current savings"
          value={formatCurrency(profile.current_savings, { compact: true })}
          icon={Wallet}
          tone="emerald"
          detail={
            <span className={aboveTarget ? 'text-emerald-300/80' : 'text-amber'}>
              {aboveTarget
                ? `${formatCurrency(profile.current_savings - profile.emergency_fund_target)} above reserve target`
                : `${formatCurrency(profile.emergency_gap)} short of reserve target`}
            </span>
          }
        />
        <MetricCard
          label="Monthly free cash flow"
          value={formatCurrency(profile.monthly_free_cash_flow, { compact: true })}
          icon={TrendingUp}
          tone="sky"
          detail={`${formatPercent(profile.savings_rate_pct)} of income left after outgoings`}
        />
        <MetricCard
          label="Emergency cover"
          value={`${profile.emergency_coverage_months.toFixed(1)} mo`}
          icon={ShieldCheck}
          tone="violet"
          detail={`Your target is ${emergencyTargetMonths.toFixed(1)} months of essentials`}
        />
        <MetricCard
          label="Safe to spend"
          value={formatCurrency(profile.safe_to_spend, { compact: true })}
          icon={CalendarClock}
          tone="amber"
          detail={`${formatPercent(profile.purchase_readiness_pct)} of your planned purchase`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,1fr)]" aria-label="Outlook and health">
        <SavingsProjectionChart projection={dashboard.projection} emergencyTarget={profile.emergency_fund_target} />
        <FinancialHealthCard
          profile={profile}
          cashflow={dashboard.cashflow}
          insight={dashboard.insight}
          monthlyCommitment={dashboard.monthly_installment_commitment}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,1fr)]" aria-label="Next decision and payments">
        <NextDecisionCard purchase={plannedPurchase} currentSavings={profile.current_savings} />
        <UpcomingPaymentsCard
          installments={dashboard.upcoming_installments}
          monthlyCommitment={dashboard.monthly_installment_commitment}
          activeCount={dashboard.active_installments}
        />
      </section>

      <section className="space-y-3" aria-label="Recent activity">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-ink">Recent activity</h2>
          <Link to="/installments" className="flex items-center gap-1 text-[10px] font-medium text-faint hover:text-muted">
            Payment history <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <RecentAnalysis simulation={dashboard.recent_simulation} />
      </section>

      <p className="px-1 pt-1 text-[9px] leading-relaxed text-faint/80">
        Projections are estimates based on the assumptions you enter. They are not financial advice. No investment
        returns or tax effects are modelled.
      </p>
    </div>
  )
}
