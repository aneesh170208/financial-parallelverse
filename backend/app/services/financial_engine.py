"""Core deterministic cash-flow projection primitives."""

from __future__ import annotations

from datetime import date

from .affordability import ProfileLike, money
from .date_utils import add_months, month_label


def baseline_points(
    profile: ProfileLike,
    months: int,
    start_date: date | None = None,
) -> list[dict]:
    """Project savings under unchanged income and spending assumptions.

    Point 0 represents today. Returns month-end balances for the requested
    horizon. No investment returns are assumed, which keeps the forecast
    deliberately conservative and easy to explain.
    """
    start = start_date or date.today()
    net_monthly = (
        float(profile.monthly_income)
        - float(profile.essential_expenses)
        - float(profile.discretionary_expenses)
        - float(profile.existing_debt_payments)
    )
    balance = float(profile.current_savings)
    points = [
        {
            "month": 0,
            "label": "Now",
            "date": start.isoformat(),
            "savings": money(balance),
            "cash_flow": 0.0,
            "outflow": 0.0,
        }
    ]
    for index in range(1, months + 1):
        current_date = add_months(start, index)
        balance += net_monthly
        points.append(
            {
                "month": index,
                "label": month_label(current_date),
                "date": current_date.isoformat(),
                "savings": money(balance),
                "cash_flow": money(net_monthly),
                "outflow": 0.0,
            }
        )
    return points


def free_cash_flow(profile: ProfileLike) -> float:
    return money(
        float(profile.monthly_income)
        - float(profile.essential_expenses)
        - float(profile.discretionary_expenses)
        - float(profile.existing_debt_payments)
    )


def cashflow_breakdown(profile: ProfileLike) -> dict[str, float]:
    income = float(profile.monthly_income)
    essential = float(profile.essential_expenses)
    discretionary = float(profile.discretionary_expenses)
    debt = float(profile.existing_debt_payments)
    return {
        "income": money(income),
        "essential": money(essential),
        "discretionary": money(discretionary),
        "debt": money(debt),
        "free_cash_flow": money(income - essential - discretionary - debt),
    }
