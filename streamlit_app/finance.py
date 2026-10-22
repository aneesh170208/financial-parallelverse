"""Pure Python finance helpers used by the Streamlit interface.

The API remains the source of truth. These helpers mirror the deterministic
profile scoring math so the profile editor can show an instant preview without
a round trip. Keep them in sync with ``backend/app/services/affordability.py``.
"""

from __future__ import annotations

import calendar
import math
from datetime import date


def add_months(value: date, months: int) -> date:
    """Add calendar months while clamping to the last valid day of the month."""
    target_month = value.month - 1 + months
    year = value.year + target_month // 12
    month = target_month % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def money(value: float) -> float:
    return round(float(value), 2)


def derive_preview(
    *,
    monthly_income: float,
    current_savings: float,
    essential_expenses: float,
    discretionary_expenses: float,
    existing_debt_payments: float,
    emergency_fund_target: float,
    planned_purchase_amount: float,
    today: date | None = None,
) -> dict:
    """Return the same derived metrics as the backend profile endpoint."""
    today = today or date.today()
    income = max(0.0, float(monthly_income))
    savings = max(0.0, float(current_savings))
    essential = max(0.0, float(essential_expenses))
    discretionary = max(0.0, float(discretionary_expenses))
    debt = max(0.0, float(existing_debt_payments))
    target = max(0.0, float(emergency_fund_target))
    purchase = max(0.0, float(planned_purchase_amount))

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

    savings_rate_points = clamp(savings_rate / 30, 0, 1) * 25
    emergency_points = clamp(coverage / 6, 0, 1) * 30
    debt_points = (1 - clamp(debt_ratio / 30, 0, 1)) * 20
    cashflow_points = clamp(free_cash_flow / income, 0, 1) * 15 if income > 0 else 0
    buffer_points = 10 if emergency_gap <= 0 else clamp(1 - emergency_gap / max(target, 1), 0, 1) * 5
    health_score = round(
        clamp(
            savings_rate_points + emergency_points + debt_points + cashflow_points + buffer_points,
            0,
            100,
        )
    )

    if health_score >= 85:
        health_label = "Resilient"
    elif health_score >= 70:
        health_label = "Stable"
    elif health_score >= 50:
        health_label = "Watchful"
    else:
        health_label = "Fragile"

    projected_date = add_months(today, months_to_purchase) if months_to_purchase is not None else None

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
