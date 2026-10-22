export interface ProfileNumbers {
  monthly_income: number
  current_savings: number
  essential_expenses: number
  discretionary_expenses: number
  existing_debt_payments: number
  emergency_fund_target: number
  planned_purchase_amount: number
}

export interface ProfilePreviewMetrics {
  monthlyExpenses: number
  freeCashFlow: number
  savingsRatePct: number
  coverageMonths: number
  emergencyGap: number
  safeToSpend: number
  readinessPct: number
  purchaseGap: number
  monthsToPurchase: number | null
  debtToIncomePct: number
  fixedCommitmentRatioPct: number
  healthScore: number
  healthLabel: string
}

function safe(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value))
}

/**
 * Mirrors the deterministic affordability model in
 * backend/app/services/affordability.py so the profile form can preview the
 * impact of edits before they are saved.
 */
export function deriveProfilePreview(numbers: ProfileNumbers): ProfilePreviewMetrics {
  const income = Math.max(0, safe(numbers.monthly_income))
  const savings = Math.max(0, safe(numbers.current_savings))
  const essential = Math.max(0, safe(numbers.essential_expenses))
  const discretionary = Math.max(0, safe(numbers.discretionary_expenses))
  const debt = Math.max(0, safe(numbers.existing_debt_payments))
  const target = Math.max(0, safe(numbers.emergency_fund_target))
  const purchase = Math.max(0, safe(numbers.planned_purchase_amount))

  const monthlyExpenses = essential + discretionary + debt
  const freeCashFlow = income - monthlyExpenses
  const savingsRatePct = income > 0 ? (freeCashFlow / income) * 100 : 0
  const coverageMonths = essential > 0 ? savings / essential : savings > 0 ? 99 : 0
  const emergencyGap = Math.max(0, target - savings)
  const safeToSpend = Math.max(0, savings - target)
  const readinessPct = purchase > 0 ? Math.min(100, (safeToSpend / purchase) * 100) : 100
  const purchaseGap = Math.max(0, purchase - safeToSpend)
  const debtToIncomePct = income > 0 ? (debt / income) * 100 : 0
  const fixedCommitmentRatioPct = income > 0 ? ((essential + debt) / income) * 100 : 0

  let monthsToPurchase: number | null
  if (purchaseGap <= 0) {
    monthsToPurchase = 0
  } else if (freeCashFlow > 0) {
    monthsToPurchase = Math.ceil(purchaseGap / freeCashFlow)
  } else {
    monthsToPurchase = null
  }

  const savingsRatePoints = clamp(savingsRatePct / 30, 0, 1) * 25
  const emergencyPoints = clamp(coverageMonths / 6, 0, 1) * 30
  const debtPoints = (1 - clamp(debtToIncomePct / 30, 0, 1)) * 20
  const cashflowPoints = income > 0 ? clamp(freeCashFlow / income, 0, 1) * 15 : 0
  const bufferPoints = emergencyGap <= 0 ? 10 : clamp(1 - emergencyGap / Math.max(target, 1), 0, 1) * 5
  const healthScore = Math.round(
    clamp(savingsRatePoints + emergencyPoints + debtPoints + cashflowPoints + bufferPoints, 0, 100),
  )

  const healthLabel =
    healthScore >= 85 ? 'Resilient' : healthScore >= 70 ? 'Stable' : healthScore >= 50 ? 'Watchful' : 'Fragile'

  return {
    monthlyExpenses,
    freeCashFlow,
    savingsRatePct,
    coverageMonths: Math.min(coverageMonths, 99),
    emergencyGap,
    safeToSpend,
    readinessPct,
    purchaseGap,
    monthsToPurchase,
    debtToIncomePct,
    fixedCommitmentRatioPct,
    healthScore,
    healthLabel,
  }
}
