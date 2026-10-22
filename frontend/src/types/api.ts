export type RiskLevel = 'resilient' | 'steady' | 'fragile' | 'critical'
export type DueStatus = 'overdue' | 'due_soon' | 'upcoming' | 'completed'
export type AssessmentStatus = 'ready' | 'on_track' | 'needs_adjustment' | 'blocked'

export interface Profile {
  id: number
  name: string
  monthly_income: number
  current_savings: number
  essential_expenses: number
  discretionary_expenses: number
  existing_debt_payments: number
  emergency_fund_target: number
  planned_purchase_amount: number
  expected_purchase_date: string
  currency: string
  updated_at: string
  monthly_expenses: number
  monthly_free_cash_flow: number
  savings_rate_pct: number
  debt_to_income_pct: number
  fixed_commitment_ratio_pct: number
  emergency_coverage_months: number
  emergency_gap: number
  safe_to_spend: number
  purchase_readiness_pct: number
  purchase_gap: number
  months_to_purchase: number | null
  projected_affordable_date: string | null
  health_score: number
  health_label: string
}

export interface CashflowBreakdown {
  income: number
  essential: number
  discretionary: number
  debt: number
  free_cash_flow: number
}

export interface ProjectionPoint {
  month: number
  label: string
  date: string
  savings: number
  cash_flow: number
  outflow: number
}

export interface PurchaseSnapshot {
  title: string
  amount: number
  target_date: string
  days_until_target: number
  safe_to_spend: number
  gap: number
  readiness_pct: number
  months_to_purchase: number | null
  saved_plan_id: number | null
  monthly_saving_plan: number
}

export interface UpcomingInstallment {
  id: number
  name: string
  merchant: string
  amount: number
  due_date: string
  days_until_due: number
  due_status: DueStatus
}

export interface RecentSimulation {
  id: number
  title: string
  purchase_amount: number
  recommended_scenario: string
  created_at: string
}

export interface Dashboard {
  profile: Profile
  cashflow: CashflowBreakdown
  projection: ProjectionPoint[]
  purchase: PurchaseSnapshot
  upcoming_installments: UpcomingInstallment[]
  recent_simulation: RecentSimulation | null
  insight: string
  monthly_installment_commitment: number
  active_installments: number
}

export interface ScenarioPathPoint {
  month: number
  label: string
  date: string
  savings: number
  cash_flow: number
  income: number
  expenses: number
  outflow: number
  event: string
}

export interface PurchaseEvent {
  month: number
  label: string
  type: string
  amount: number
}

export interface Scenario {
  id: string
  name: string
  short_name: string
  tagline: string
  description: string
  color: string
  is_baseline: boolean
  path: ScenarioPathPoint[]
  final_savings: number
  minimum_savings: number
  current_savings_after_decision: number
  emergency_shortfall: number
  months_of_cover: number
  average_monthly_cash_flow: number
  total_outflow: number
  monthly_commitment: number
  interest_paid: number
  total_cost: number
  risk: RiskLevel
  risk_label: string
  score: number
  verdict: string
  purchase_events: PurchaseEvent[]
  extra_details: string[]
}

export interface Recommendation {
  scenario_id: string
  scenario_name: string
  headline: string
  rationale: string
  safe_to_spend_now: number
  extra_to_save: number
  suggested_monthly_saving: number
  total_interest_compared: number
}

export interface StressTest {
  id: string
  name: string
  description: string
  final_savings: number
  minimum_savings: number
  emergency_shortfall: number
  impact_vs_no_surprises: number
  months_of_cover: number
  risk: RiskLevel
  risk_label: string
}

export interface SimulationAssumptions {
  wait_months: number
  cheaper_price: number
  emi_down_payment_pct: number
  emi_annual_rate_pct: number
  emi_tenure_months: number
  unexpected_expense_amount: number
  unexpected_expense_month: number
  delayed_salary_months: number
  spending_increase_pct: number
  investment_return_assumed: number
}

export interface SimulationResult {
  run_id: number | null
  generated_at: string
  horizon_months: number
  purchase_amount: number
  scenarios: Scenario[]
  recommendation: Recommendation
  stress_tests: StressTest[]
  assumptions: SimulationAssumptions
}

export interface SimulationInput {
  title?: string
  horizon_months: number
  purchase_amount: number
  wait_months: number
  cheaper_price: number
  emi_down_payment_pct: number
  emi_annual_rate_pct: number
  emi_tenure_months: number
  unexpected_expense_amount: number
  unexpected_expense_month: number
  delayed_salary_months: number
  spending_increase_pct: number
}

export type HealthFactorStatus = 'good' | 'watch' | 'risk'

export interface HealthFactor {
  key: string
  label: string
  value: string
  detail: string
  status: HealthFactorStatus
}

export interface TrajectoryPoint {
  month: number
  label: string
  available_for_purchase: number
  goal: number
}

export interface PurchaseAssessment {
  title: string
  amount: number
  target_date: string
  months_until_target: number
  safe_to_spend: number
  available_today: number
  gap: number
  readiness_pct: number
  months_to_goal: number | null
  estimated_affordable_date: string | null
  on_track: boolean
  status: AssessmentStatus
  headline: string
  summary: string
  monthly_saving_needed: number
  recommended_monthly_saving: number
  recommended_first_step: string
  factors: HealthFactor[]
  recommendations: string[]
  trajectory: TrajectoryPoint[]
  suggested_alternative: number
}

export interface PurchasePlan {
  id: number
  title: string
  amount: number
  target_date: string
  monthly_saving_plan: number
  notes: string
  status: string
  created_at: string
  updated_at: string
}

export interface EMIScheduleItem {
  month: number
  emi: number
  principal: number
  interest: number
  balance: number
}

export interface EMIAffordability {
  monthly_emi: number
  emi_to_income_pct: number
  free_cash_flow_after_emi: number
  status: 'comfortable' | 'cautious' | 'stretched' | 'unaffordable'
  label: string
  message: string
}

export interface EMIResult {
  principal: number
  annual_rate_pct: number
  tenure_months: number
  monthly_emi: number
  total_interest: number
  total_payment: number
  processing_fee: number
  total_cost: number
  effective_cost_pct: number
  schedule: EMIScheduleItem[]
  affordability: EMIAffordability | null
}

export interface InstallmentPayment {
  id: number
  amount: number
  due_date: string
  paid_at: string
}

export interface InstallmentPlan {
  id: number
  name: string
  merchant: string
  total_amount: number
  upfront_payment: number
  financed_amount: number
  monthly_installment: number
  tenure_months: number
  paid_installments: number
  remaining_installments: number
  outstanding_amount: number
  next_due_date: string
  days_until_due: number
  due_status: DueStatus
  progress_pct: number
  annual_rate_pct: number
  notes: string
  status: string
  created_at: string
  payments: InstallmentPayment[]
}

export interface Reminder {
  plan_id: number
  name: string
  merchant: string
  amount: number
  due_date: string
  days_until_due: number
  due_status: DueStatus
}

export interface InstallmentSummary {
  active_plans: number
  monthly_commitment: number
  outstanding_total: number
  next_due_date: string | null
  overdue_count: number
  due_soon_count: number
}

export interface InstallmentCollection {
  summary: InstallmentSummary
  plans: InstallmentPlan[]
  reminders: Reminder[]
}

export interface InstallmentInput {
  name: string
  merchant: string
  total_amount: number
  upfront_payment: number
  monthly_installment: number
  tenure_months: number
  paid_installments: number
  next_due_date: string
  annual_rate_pct: number
  notes: string
}

export interface PurchasePlanInput {
  title: string
  amount: number
  target_date: string
  monthly_saving_plan: number
  notes: string
  update_profile: boolean
}
