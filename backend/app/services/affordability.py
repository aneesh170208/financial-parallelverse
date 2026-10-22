"""Profile-level affordability, health scoring, and purchase readiness.

All calculations are deterministic and deliberately conservative. The emergency
fund is treated as protected money; "safe to spend" only includes savings above
that target.
"""

from __future__ import annotations

import math
from datetime import date
from typing import Protocol

from .date_utils import add_months


class ProfileLike(Protocol):
    monthly_income: float
    current_savings: float
    essential_expenses: float
    discretionary_expenses: float
    existing_debt_payments: float
    emergency_fund_target: float
    planned_purchase_amount: float
    expected_purchase_date: date


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def money(value: float) -> float:
    return round(float(value), 2)


def derive_profile(profile: ProfileLike) -> dict:
    """Return derived cash-flow and resilience metrics for a profile."""
    income = max(0.0, profile.monthly_income)
    savings = max(0.0, profile.current_savings)
    essential = max(0.0, profile.essential_expenses)
    discretionary = max(0.0, profile.discretionary_expenses)
    debt = max(0.0, profile.existing_debt_payments)
    target = max(0.0, profile.emergency_fund_target)
    purchase = max(0.0, profile.planned_purchase_amount)

    monthly_expenses = essential + discretionary + debt
    free_cash_flow = income - monthly_expenses
    savings_rate = (free_cash_flow / income * 100) if income > 0 else 0.0
    coverage = (savings / essential) if essential > 0 else (99.0 if savings > 0 else 0.0)
    emergency_gap = max(0.0, target - savings)
    safe_to_spend = max(0.0, savings - target)
    readiness = min(100.0, safe_to_spend / purchase * 100) if purchase > 0 else 100.0
    purchase_gap = max(0.0, purchase - safe_to_spend)

    months_to_purchase: int | None
    if purchase_gap <= 0:
        months_to_purchase = 0
    elif free_cash_flow > 0:
        months_to_purchase = math.ceil(purchase_gap / free_cash_flow)
    else:
        months_to_purchase = None

    debt_ratio = (debt / income * 100) if income > 0 else 0.0
    fixed_commitment_ratio = ((essential + debt) / income * 100) if income > 0 else 0.0

    # A transparent 100-point wellness score. Each component is capped so a
    # single strong metric cannot hide a weak safety net.
    savings_rate_points = clamp(savings_rate / 30, 0, 1) * 25
    emergency_points = clamp(coverage / 6, 0, 1) * 30
    debt_points = (1 - clamp(debt_ratio / 30, 0, 1)) * 20
    cashflow_points = clamp(free_cash_flow / income, 0, 1) * 15 if income > 0 else 0
    buffer_points = 10 if emergency_gap <= 0 else clamp(1 - emergency_gap / max(target, 1), 0, 1) * 5
    health_score = round(clamp(savings_rate_points + emergency_points + debt_points + cashflow_points + buffer_points, 0, 100))

    if health_score >= 85:
        health_label = "Resilient"
    elif health_score >= 70:
        health_label = "Stable"
    elif health_score >= 50:
        health_label = "Watchful"
    else:
        health_label = "Fragile"

    projected_date = add_months(date.today(), months_to_purchase) if months_to_purchase is not None else None

    return {
        "monthly_expenses": money(monthly_expenses),
        "monthly_free_cash_flow": money(free_cash_flow),
        "savings_rate_pct": round(savings_rate, 1),
        "debt_to_income_pct": round(debt_ratio, 1),
        "fixed_commitment_ratio_pct": round(fixed_commitment_ratio, 1),
        "emergency_coverage_months": round(min(coverage, 99.0), 1),
        "emergency_gap": money(emergency_gap),
        "safe_to_spend": money(safe_to_spend),
        "purchase_readiness_pct": round(readiness, 1),
        "purchase_gap": money(purchase_gap),
        "months_to_purchase": months_to_purchase,
        "projected_affordable_date": projected_date,
        "health_score": health_score,
        "health_label": health_label,
    }


def build_insight(profile: ProfileLike, derived: dict) -> str:
    """Pick the highest-priority, actionable observation for the dashboard."""
    if derived["monthly_free_cash_flow"] <= 0:
        return "Your monthly outgoings meet or exceed your income. Pause new commitments and rebuild cash flow first."

    if derived["emergency_gap"] > 0:
        gap = derived["emergency_gap"]
        return f"Your emergency fund is ₹{gap:,.0f} short of target. Protect your buffer before adding a purchase."

    months = derived["months_to_purchase"]
    purchase = max(0.0, profile.planned_purchase_amount)
    if months == 0:
        return "Your planned purchase fits inside your safe-to-spend amount without touching your emergency reserve."
    if months is not None:
        return f"At your current pace, you can comfortably afford your ₹{purchase:,.0f} plan in about {months} month{'s' if months != 1 else ''}."

    return "Your plan has room to improve. Reducing discretionary spend would strengthen your purchase readiness."
