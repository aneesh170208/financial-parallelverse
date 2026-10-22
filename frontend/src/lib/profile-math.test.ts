import { describe, expect, it } from 'vitest'

import { deriveProfilePreview } from './profile-math'

const demo = {
  monthly_income: 82000,
  current_savings: 220000,
  essential_expenses: 30000,
  discretionary_expenses: 11000,
  existing_debt_payments: 7500,
  emergency_fund_target: 180000,
  planned_purchase_amount: 70000,
}

describe('deriveProfilePreview', () => {
  it('matches the backend affordability model for the demo profile', () => {
    const result = deriveProfilePreview(demo)

    expect(result.monthlyExpenses).toBe(48500)
    expect(result.freeCashFlow).toBe(33500)
    expect(result.savingsRatePct).toBeCloseTo(40.85, 1)
    expect(result.coverageMonths).toBeCloseTo(7.3, 1)
    expect(result.emergencyGap).toBe(0)
    expect(result.safeToSpend).toBe(40000)
    expect(result.readinessPct).toBeCloseTo(57.14, 1)
    expect(result.purchaseGap).toBe(30000)
    expect(result.monthsToPurchase).toBe(1)
    expect(result.debtToIncomePct).toBeCloseTo(9.15, 1)
    expect(result.healthScore).toBe(85)
    expect(result.healthLabel).toBe('Resilient')
  })

  it('never counts the emergency reserve as spendable', () => {
    const result = deriveProfilePreview({
      ...demo,
      current_savings: 100000,
    })

    expect(result.safeToSpend).toBe(0)
    expect(result.emergencyGap).toBe(80000)
    expect(result.readinessPct).toBe(0)
    expect(result.purchaseGap).toBe(70000)
  })

  it('reports no affordable timeline when cash flow is not positive', () => {
    const result = deriveProfilePreview({
      ...demo,
      monthly_income: 40000,
    })

    expect(result.freeCashFlow).toBeLessThan(0)
    expect(result.savingsRatePct).toBeLessThan(0)
    expect(result.monthsToPurchase).toBeNull()
    expect(result.healthScore).toBeLessThan(50)
    expect(result.healthLabel).toBe('Fragile')
  })

  it('treats a zero purchase amount as fully ready', () => {
    const result = deriveProfilePreview({
      ...demo,
      planned_purchase_amount: 0,
    })

    expect(result.readinessPct).toBe(100)
    expect(result.purchaseGap).toBe(0)
    expect(result.monthsToPurchase).toBe(0)
  })

  it('handles zero income, zero essentials and non-finite inputs safely', () => {
    const result = deriveProfilePreview({
      monthly_income: 0,
      current_savings: Number.NaN,
      essential_expenses: 0,
      discretionary_expenses: 0,
      existing_debt_payments: 0,
      emergency_fund_target: 0,
      planned_purchase_amount: 0,
    })

    expect(result.monthlyExpenses).toBe(0)
    expect(result.freeCashFlow).toBe(0)
    expect(result.savingsRatePct).toBe(0)
    expect(result.coverageMonths).toBe(0)
    expect(result.emergencyGap).toBe(0)
    expect(result.safeToSpend).toBe(0)
    expect(result.healthScore).toBe(30)
    expect(result.healthLabel).toBe('Fragile')
  })
})
