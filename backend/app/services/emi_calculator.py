"""EMI math with amortization and affordability context."""

from __future__ import annotations

from typing import Protocol

from .affordability import derive_profile, money


class EMIProfileLike(Protocol):
    monthly_income: float
    current_savings: float
    essential_expenses: float
    discretionary_expenses: float
    existing_debt_payments: float
    emergency_fund_target: float
    planned_purchase_amount: float
    expected_purchase_date: object


def calculate_emi(
    principal: float,
    annual_rate_pct: float,
    tenure_months: int,
    processing_fee_pct: float = 0.0,
    processing_fee_fixed: float = 0.0,
    profile: EMIProfileLike | None = None,
) -> dict:
    principal = max(0.0, float(principal))
    annual_rate_pct = max(0.0, float(annual_rate_pct))
    tenure_months = max(1, int(tenure_months))

    monthly_rate = annual_rate_pct / 12 / 100
    if monthly_rate == 0:
        emi = principal / tenure_months
    else:
        factor = (1 + monthly_rate) ** tenure_months
        emi = principal * monthly_rate * factor / (factor - 1)

    balance = principal
    schedule: list[dict] = []
    for month in range(1, tenure_months + 1):
        interest = balance * monthly_rate
        principal_paid = emi - interest
        if month == tenure_months:
            principal_paid = balance
            emi_this_month = principal_paid + interest
            balance = 0.0
        else:
            emi_this_month = emi
            balance = max(0.0, balance - principal_paid)
        schedule.append(
            {
                "month": month,
                "emi": money(emi_this_month),
                "principal": money(principal_paid),
                "interest": money(interest),
                "balance": money(balance),
            }
        )

    total_payment = sum(item["emi"] for item in schedule)
    total_interest = sum(item["interest"] for item in schedule)
    processing_fee = principal * processing_fee_pct / 100 + processing_fee_fixed
    total_cost = total_payment + processing_fee
    monthly_emi = emi

    result = {
        "principal": money(principal),
        "annual_rate_pct": round(annual_rate_pct, 2),
        "tenure_months": tenure_months,
        "monthly_emi": money(monthly_emi),
        "total_interest": money(total_interest),
        "total_payment": money(total_payment),
        "processing_fee": money(processing_fee),
        "total_cost": money(total_cost),
        "effective_cost_pct": round((total_interest + processing_fee) / principal * 100, 2) if principal else 0.0,
        "schedule": schedule,
        "affordability": None,
    }

    if profile is not None:
        derived = derive_profile(profile)
        income = max(0.0, float(profile.monthly_income))
        payment_ratio = (monthly_emi / income * 100) if income > 0 else 0.0
        fcf_after = derived["monthly_free_cash_flow"] - monthly_emi
        if fcf_after < 0:
            status = "unaffordable"
            label = "Cash-flow gap"
        elif payment_ratio > 30:
            status = "stretched"
            label = "Stretched"
        elif payment_ratio > 15:
            status = "cautious"
            label = "Use with care"
        else:
            status = "comfortable"
            label = "Comfortable"
        result["affordability"] = {
            "monthly_emi": money(monthly_emi),
            "emi_to_income_pct": round(payment_ratio, 1),
            "free_cash_flow_after_emi": money(fcf_after),
            "status": status,
            "label": label,
            "message": (
                "This EMI fits within 15% of monthly income."
                if status == "comfortable"
                else (
                    "This EMI is manageable, but leaves less room for surprises."
                    if status == "cautious"
                    else (
                        "This EMI consumes a large share of monthly income."
                        if status == "stretched"
                        else "Your remaining cash flow cannot comfortably cover this EMI."
                    )
                )
            ),
        }

    return result
