"""Purchase feasibility assessment and progress planning."""

from __future__ import annotations

import math
from datetime import date

from .affordability import ProfileLike, derive_profile, money
from .date_utils import add_months, month_label
from .financial_engine import free_cash_flow


def assess_purchase(
    profile: ProfileLike,
    amount: float,
    target_date: date | None = None,
    title: str = "Planned purchase",
    today: date | None = None,
) -> dict:
    today = today or date.today()
    amount = max(0.0, float(amount))
    target = target_date or getattr(profile, "expected_purchase_date", today)
    derived = derive_profile(profile)
    safe_to_spend = derived["safe_to_spend"]
    available_today = min(amount, safe_to_spend)
    gap = max(0.0, amount - safe_to_spend)
    readiness = min(100.0, available_today / amount * 100) if amount > 0 else 100.0
    fcf = free_cash_flow(profile)
    days_until_target = (target - today).days
    months_until_target = max(0, math.ceil(days_until_target / 30)) if days_until_target > 0 else 0

    if gap <= 0:
        months_to_goal: int | None = 0
    elif fcf > 0:
        months_to_goal = math.ceil(gap / fcf)
    else:
        months_to_goal = None

    estimated_date = add_months(today, months_to_goal) if months_to_goal is not None else None
    on_track = gap <= 0 or (months_to_goal is not None and target >= today and months_to_goal <= months_until_target)

    if gap <= 0:
        status = "ready"
        headline = "You can buy this without touching your safety net."
    elif fcf <= 0:
        status = "blocked"
        headline = "Your monthly cash flow needs attention first."
    elif on_track:
        status = "on_track"
        headline = f"When the date arrives, this plan could fit inside your buffer."
    else:
        status = "needs_adjustment"
        headline = "Your current pace and target date do not line up yet."

    months_for_saving = max(months_until_target, 1)
    monthly_saving_needed = gap / months_for_saving if gap > 0 else 0
    recommended_monthly_saving = min(max(fcf, 0), monthly_saving_needed) if gap > 0 else 0

    if status == "ready":
        summary = (
            f"You already have ₹{safe_to_spend:,.0f} above your emergency reserve. "
            f"Buying at ₹{amount:,.0f} still leaves your emergency fund untouched."
        )
        first_step = "Keep your emergency fund in a separate account before you buy."
    elif status == "on_track":
        summary = (
            f"Set aside about ₹{monthly_saving_needed:,.0f} a month to close the ₹{gap:,.0f} gap by "
            f"{target.strftime('%d %b %Y')}, while preserving your emergency reserve."
        )
        first_step = f"Automate a ₹{max(monthly_saving_needed, 1000):,.0f} transfer on payday."
    elif status == "needs_adjustment":
        summary = (
            f"At your current free cash flow, you need roughly {months_to_goal} months to build the gap. "
            f"Consider giving the plan more time or reducing the budget."
        )
        first_step = "Reduce the target by 15–20%, or move the purchase date out."
    else:
        summary = (
            "New commitments will be hard to absorb until essential costs and debt payments leave room "
            "in your monthly budget."
        )
        first_step = "Pause new purchases and revisit recurring costs or debt first."

    factors = [
        {
            "key": "emergency",
            "label": "Emergency reserve",
            "value": f"{derived['emergency_coverage_months']:.1f} months",
            "detail": (
                "Target met"
                if derived["emergency_gap"] <= 0
                else f"₹{derived['emergency_gap']:,.0f} short of target"
            ),
            "status": "good" if derived["emergency_gap"] <= 0 else (
                "watch" if derived["emergency_coverage_months"] >= 3 else "risk"
            ),
        },
        {
            "key": "cashflow",
            "label": "Monthly free cash flow",
            "value": f"₹{fcf:,.0f}",
            "detail": "Available after all planned outgoings",
            "status": "good" if fcf >= amount * 0.2 else ("watch" if fcf > 0 else "risk"),
        },
        {
            "key": "debt",
            "label": "Debt-to-income",
            "value": f"{derived['debt_to_income_pct']:.1f}%",
            "detail": "Existing monthly debt payments",
            "status": "good" if derived["debt_to_income_pct"] < 10 else (
                "watch" if derived["debt_to_income_pct"] < 20 else "risk"
            ),
        },
        {
            "key": "readiness",
            "label": "Purchase readiness",
            "value": f"{readiness:.0f}%",
            "detail": f"₹{available_today:,.0f} safely available today",
            "status": "good" if readiness >= 100 else ("watch" if readiness >= 50 else "risk"),
        },
        {
            "key": "timeline",
            "label": "Target timeline",
            "value": f"{months_until_target} months",
            "detail": (
                "On pace" if on_track else (estimated_date.strftime("Ready by %b %Y") if estimated_date else "No pace yet")
            ),
            "status": "good" if on_track else "watch",
        },
    ]

    recommendations: list[str] = []
    if derived["emergency_gap"] > 0:
        recommendations.append(
            f"Top up your emergency fund by ₹{derived['emergency_gap']:,.0f} before spending on the purchase."
        )
    else:
        recommendations.append("Keep your emergency fund outside your spending account.")
    if gap > 0:
        recommendations.append(
            f"Save ₹{monthly_saving_needed:,.0f} per month for the next {months_for_saving} months to close the gap."
        )
    if not on_track and months_to_goal is not None:
        recommendations.append(
            f"Your current pace needs about {months_to_goal} months. Extend the date to "
            f"{estimated_date.strftime('%b %Y') if estimated_date else 'later'} or lower the budget."
        )
    if fcf > 0:
        recommendations.append("Route the saving automatically within 24 hours of payday.")
    recommendations.append("Reassess this plan in 30 days or after any change in income and debt.")
    recommendations = recommendations[:4]

    horizon = min(18, max(months_for_saving + 1, (months_to_goal or 0) + 1, 3))
    trajectory = [
        {
            "month": 0,
            "label": "Now",
            "available_for_purchase": money(available_today),
            "goal": money(amount),
        }
    ]
    running = safe_to_spend
    for index in range(1, horizon + 1):
        running += max(fcf, 0)
        trajectory.append(
            {
                "month": index,
                "label": month_label(add_months(today, index)),
                "available_for_purchase": money(min(running, amount)),
                "goal": money(amount),
            }
        )

    suggested_alternative = money(max(0.0, min(amount * 0.82, safe_to_spend + max(fcf, 0) * min(months_for_saving, 4))))

    return {
        "title": title,
        "amount": money(amount),
        "target_date": target,
        "months_until_target": months_until_target,
        "safe_to_spend": money(safe_to_spend),
        "available_today": money(available_today),
        "gap": money(gap),
        "readiness_pct": round(readiness, 1),
        "months_to_goal": months_to_goal,
        "estimated_affordable_date": estimated_date,
        "on_track": on_track,
        "status": status,
        "headline": headline,
        "summary": summary,
        "monthly_saving_needed": money(monthly_saving_needed),
        "recommended_monthly_saving": money(recommended_monthly_saving),
        "recommended_first_step": first_step,
        "factors": factors,
        "recommendations": recommendations,
        "trajectory": trajectory,
        "suggested_alternative": suggested_alternative,
    }
