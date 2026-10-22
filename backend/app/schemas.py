from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .models import Profile
from .services.affordability import derive_profile


class APIModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, from_attributes=True)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------


class ProfileBase(APIModel):
    name: str = Field(default="Aarav Mehta", min_length=1, max_length=80)
    monthly_income: float = Field(default=82000, ge=0, le=1_000_000_000)
    current_savings: float = Field(default=220000, ge=0, le=1_000_000_000)
    essential_expenses: float = Field(default=30000, ge=0, le=1_000_000_000)
    discretionary_expenses: float = Field(default=11000, ge=0, le=1_000_000_000)
    existing_debt_payments: float = Field(default=7500, ge=0, le=1_000_000_000)
    emergency_fund_target: float = Field(default=180000, ge=0, le=1_000_000_000)
    planned_purchase_amount: float = Field(default=70000, ge=0, le=1_000_000_000)
    expected_purchase_date: date


class ProfileOut(ProfileBase):
    id: int
    currency: str = "INR"
    updated_at: datetime
    monthly_expenses: float
    monthly_free_cash_flow: float
    savings_rate_pct: float
    debt_to_income_pct: float
    fixed_commitment_ratio_pct: float
    emergency_coverage_months: float
    emergency_gap: float
    safe_to_spend: float
    purchase_readiness_pct: float
    purchase_gap: float
    months_to_purchase: int | None
    projected_affordable_date: date | None
    health_score: int
    health_label: str


def profile_response(profile: Profile) -> ProfileOut:
    values = {
        "id": profile.id,
        "name": profile.name,
        "monthly_income": profile.monthly_income,
        "current_savings": profile.current_savings,
        "essential_expenses": profile.essential_expenses,
        "discretionary_expenses": profile.discretionary_expenses,
        "existing_debt_payments": profile.existing_debt_payments,
        "emergency_fund_target": profile.emergency_fund_target,
        "planned_purchase_amount": profile.planned_purchase_amount,
        "expected_purchase_date": profile.expected_purchase_date,
        "currency": profile.currency,
        "updated_at": profile.updated_at,
        **derive_profile(profile),
    }
    return ProfileOut.model_validate(values)


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------


class SimulationRequest(APIModel):
    title: str = Field(default="Laptop purchase futures", min_length=1, max_length=140)
    horizon_months: int = Field(default=12, ge=1, le=60)
    purchase_amount: float | None = Field(default=None, ge=0, le=1_000_000_000)
    wait_months: int = Field(default=2, ge=1, le=24)
    cheaper_price: float | None = Field(default=None, ge=0, le=1_000_000_000)
    emi_down_payment_pct: float = Field(default=20, ge=0, le=90)
    emi_annual_rate_pct: float = Field(default=13.5, ge=0, le=60)
    emi_tenure_months: int = Field(default=12, ge=1, le=60)
    unexpected_expense_amount: float = Field(default=35000, ge=0, le=1_000_000_000)
    unexpected_expense_month: int = Field(default=4, ge=1, le=60)
    delayed_salary_months: int = Field(default=1, ge=1, le=6)
    spending_increase_pct: float = Field(default=12, ge=0, le=100)


class PathPoint(APIModel):
    month: int
    label: str
    date: str
    savings: float
    cash_flow: float
    income: float
    expenses: float
    outflow: float
    event: str


class PurchaseEvent(APIModel):
    month: int
    label: str
    type: str
    amount: float


class ScenarioOut(APIModel):
    id: str
    name: str
    short_name: str
    tagline: str
    description: str
    color: str
    is_baseline: bool
    path: list[PathPoint]
    final_savings: float
    minimum_savings: float
    current_savings_after_decision: float
    emergency_shortfall: float
    months_of_cover: float
    average_monthly_cash_flow: float
    total_outflow: float
    monthly_commitment: float
    interest_paid: float
    total_cost: float
    risk: str
    risk_label: str
    score: int
    verdict: str = ""
    purchase_events: list[PurchaseEvent]
    extra_details: list[str] = Field(default_factory=list)


class RecommendationOut(APIModel):
    scenario_id: str
    scenario_name: str
    headline: str
    rationale: str
    safe_to_spend_now: float
    extra_to_save: float
    suggested_monthly_saving: float
    total_interest_compared: float


class StressTestOut(APIModel):
    id: str
    name: str
    description: str
    final_savings: float
    minimum_savings: float
    emergency_shortfall: float
    impact_vs_no_surprises: float
    months_of_cover: float
    risk: str
    risk_label: str


class AssumptionsOut(APIModel):
    wait_months: int
    cheaper_price: float
    emi_down_payment_pct: float
    emi_annual_rate_pct: float
    emi_tenure_months: int
    unexpected_expense_amount: float
    unexpected_expense_month: int
    delayed_salary_months: int
    spending_increase_pct: float
    investment_return_assumed: float


class SimulationResponse(APIModel):
    run_id: int | None = None
    generated_at: str
    horizon_months: int
    purchase_amount: float
    scenarios: list[ScenarioOut]
    recommendation: RecommendationOut
    stress_tests: list[StressTestOut]
    assumptions: AssumptionsOut


# ---------------------------------------------------------------------------
# Purchase assessment
# ---------------------------------------------------------------------------


class PurchaseAssessmentRequest(APIModel):
    amount: float | None = Field(default=None, ge=0, le=1_000_000_000)
    target_date: date | None = None
    title: str = Field(default="Planned purchase", min_length=1, max_length=140)


class HealthFactor(APIModel):
    key: str
    label: str
    value: str
    detail: str
    status: Literal["good", "watch", "risk"]


class TrajectoryPoint(APIModel):
    month: int
    label: str
    available_for_purchase: float
    goal: float


class PurchaseAssessmentResponse(APIModel):
    title: str
    amount: float
    target_date: date
    months_until_target: int
    safe_to_spend: float
    available_today: float
    gap: float
    readiness_pct: float
    months_to_goal: int | None
    estimated_affordable_date: date | None
    on_track: bool
    status: Literal["ready", "on_track", "needs_adjustment", "blocked"]
    headline: str
    summary: str
    monthly_saving_needed: float
    recommended_monthly_saving: float
    recommended_first_step: str
    factors: list[HealthFactor]
    recommendations: list[str]
    trajectory: list[TrajectoryPoint]
    suggested_alternative: float


class PurchasePlanCreate(APIModel):
    title: str = Field(min_length=1, max_length=140)
    amount: float = Field(gt=0, le=1_000_000_000)
    target_date: date
    monthly_saving_plan: float = Field(default=0, ge=0, le=100_000_000)
    notes: str = Field(default="", max_length=1000)
    update_profile: bool = True


class PurchasePlanOut(APIModel):
    id: int
    title: str
    amount: float
    target_date: date
    monthly_saving_plan: float
    notes: str
    status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# EMI
# ---------------------------------------------------------------------------


class EMIRequest(APIModel):
    principal: float = Field(gt=0, le=1_000_000_000)
    annual_rate_pct: float = Field(default=13.5, ge=0, le=60)
    tenure_months: int = Field(default=12, ge=1, le=360)
    processing_fee_pct: float = Field(default=0, ge=0, le=10)
    processing_fee_fixed: float = Field(default=0, ge=0, le=100_000_000)


class EMIScheduleItem(APIModel):
    month: int
    emi: float
    principal: float
    interest: float
    balance: float


class EMIAffordability(APIModel):
    monthly_emi: float
    emi_to_income_pct: float
    free_cash_flow_after_emi: float
    status: Literal["comfortable", "cautious", "stretched", "unaffordable"]
    label: str
    message: str


class EMIResponse(APIModel):
    principal: float
    annual_rate_pct: float
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_payment: float
    processing_fee: float
    total_cost: float
    effective_cost_pct: float
    schedule: list[EMIScheduleItem]
    affordability: EMIAffordability | None = None


# ---------------------------------------------------------------------------
# Installments
# ---------------------------------------------------------------------------


class InstallmentPlanCreate(APIModel):
    name: str = Field(min_length=1, max_length=100)
    merchant: str = Field(default="", max_length=100)
    total_amount: float = Field(gt=0, le=1_000_000_000)
    upfront_payment: float = Field(default=0, ge=0, le=1_000_000_000)
    monthly_installment: float = Field(gt=0, le=100_000_000)
    tenure_months: int = Field(ge=1, le=120)
    paid_installments: int = Field(default=0, ge=0)
    next_due_date: date
    annual_rate_pct: float = Field(default=0, ge=0, le=100)
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def validate_totals(self) -> "InstallmentPlanCreate":
        if self.upfront_payment >= self.total_amount:
            raise ValueError("Upfront payment must be less than the total amount")
        if self.paid_installments > self.tenure_months:
            raise ValueError("Paid installments cannot exceed the tenure")
        return self


class PaymentOut(APIModel):
    id: int
    amount: float
    due_date: date
    paid_at: datetime


class InstallmentOut(APIModel):
    id: int
    name: str
    merchant: str
    total_amount: float
    upfront_payment: float
    financed_amount: float
    monthly_installment: float
    tenure_months: int
    paid_installments: int
    remaining_installments: int
    outstanding_amount: float
    next_due_date: date
    days_until_due: int
    due_status: Literal["overdue", "due_soon", "upcoming", "completed"]
    progress_pct: float
    annual_rate_pct: float
    notes: str
    status: str
    created_at: datetime
    payments: list[PaymentOut] = Field(default_factory=list)


class ReminderOut(APIModel):
    plan_id: int
    name: str
    merchant: str
    amount: float
    due_date: date
    days_until_due: int
    due_status: Literal["overdue", "due_soon", "upcoming"]


class InstallmentSummaryOut(APIModel):
    active_plans: int
    monthly_commitment: float
    outstanding_total: float
    next_due_date: date | None
    overdue_count: int
    due_soon_count: int


class InstallmentCollectionOut(APIModel):
    summary: InstallmentSummaryOut
    plans: list[InstallmentOut]
    reminders: list[ReminderOut]


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


class CashflowBreakdownOut(APIModel):
    income: float
    essential: float
    discretionary: float
    debt: float
    free_cash_flow: float


class ProjectionPointOut(APIModel):
    month: int
    label: str
    date: str
    savings: float
    cash_flow: float
    outflow: float


class PurchaseSnapshotOut(APIModel):
    title: str
    amount: float
    target_date: date
    days_until_target: int
    safe_to_spend: float
    gap: float
    readiness_pct: float
    months_to_purchase: int | None
    saved_plan_id: int | None = None
    monthly_saving_plan: float = 0


class UpcomingInstallmentOut(APIModel):
    id: int
    name: str
    merchant: str
    amount: float
    due_date: date
    days_until_due: int
    due_status: str


class RecentSimulationOut(APIModel):
    id: int
    title: str
    purchase_amount: float
    recommended_scenario: str
    created_at: datetime


class DashboardOut(APIModel):
    profile: ProfileOut
    cashflow: CashflowBreakdownOut
    projection: list[ProjectionPointOut]
    purchase: PurchaseSnapshotOut
    upcoming_installments: list[UpcomingInstallmentOut]
    recent_simulation: RecentSimulationOut | None
    insight: str
    monthly_installment_commitment: float
    active_installments: int


class MessageOut(APIModel):
    message: str
