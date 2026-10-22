"""Deterministic parallel-future scenario generation.

The engine intentionally makes its assumptions visible: no investment return is
credited, the emergency fund is treated as protected, and salary delays are
eventually paid in full. This makes differences between decisions explainable.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from .affordability import ProfileLike, clamp, derive_profile, money
from .date_utils import add_months, month_label
from .emi_calculator import calculate_emi


@dataclass
class TrackSpec:
    key: str
    name: str
    short_name: str
    tagline: str
    description: str
    color: str
    purchase_month: int | None = 0  # 0 = today, None = no purchase
    purchase_amount: float = 0.0
    emi_down_payment: float = 0.0
    emi_monthly: float = 0.0
    emi_tenure: int = 0
    emi_interest: float = 0.0
    unexpected_amount: float = 0.0
    unexpected_month: int = 0
    salary_delay_months: int = 0
    spending_increase_pct: float = 0.0
    is_baseline: bool = False
    extra_details: list[str] = field(default_factory=list)


def _risk_for(min_balance: float, final_balance: float, target: float) -> tuple[str, str]:
    if min_balance < 0 or final_balance < 0:
        return "critical", "Critical"
    if target > 0 and min_balance < target * 0.5:
        return "fragile", "Fragile"
    if target > 0 and min_balance < target:
        return "steady", "Steady"
    return "resilient", "Resilient"


def _score_track(
    final_balance: float,
    min_balance: float,
    target: float,
    avg_cashflow: float,
    income: float,
    total_interest: float,
    purchase_amount: float,
) -> int:
    target = max(target, 1.0)
    reserve_points = clamp(final_balance / target, 0, 1) * 55
    liquidity_points = clamp(min_balance / target, 0, 1) * 25
    cashflow_ratio = (avg_cashflow / income) if income > 0 else 0
    cashflow_points = clamp(cashflow_ratio / 0.25, 0, 1) * 10
    interest_ratio = total_interest / max(purchase_amount, 1)
    cost_points = clamp(1 - interest_ratio / 0.5, 0, 1) * 10
    return round(clamp(reserve_points + liquidity_points + cashflow_points + cost_points, 0, 100))


def _run_track(
    profile: ProfileLike,
    spec: TrackSpec,
    horizon_months: int,
    start_date: date,
) -> dict:
    base_income = max(0.0, float(profile.monthly_income))
    base_expenses = max(
        0.0,
        float(profile.essential_expenses) + float(profile.discretionary_expenses) + float(profile.existing_debt_payments),
    )
    essential = max(0.0, float(profile.essential_expenses))
    target = max(0.0, float(profile.emergency_fund_target))
    balance = max(0.0, float(profile.current_savings))

    immediate_outflow = 0.0
    if spec.purchase_month == 0:
        immediate_outflow += spec.emi_down_payment if spec.emi_monthly else spec.purchase_amount
    balance -= immediate_outflow

    points = [
        {
            "month": 0,
            "label": "Now",
            "date": start_date.isoformat(),
            "savings": money(balance),
            "cash_flow": 0.0,
            "income": 0.0,
            "expenses": 0.0,
            "outflow": money(immediate_outflow),
            "event": "Purchase" if immediate_outflow > 0 else "",
        }
    ]
    min_balance = balance
    cashflow_total = 0.0
    total_outflow = immediate_outflow
    purchase_events: list[dict] = []

    if immediate_outflow > 0:
        purchase_events.append({"month": 0, "label": "Today", "type": "Purchase", "amount": money(immediate_outflow)})

    for month in range(1, horizon_months + 1):
        income = base_income
        if spec.salary_delay_months > 0:
            if month <= spec.salary_delay_months:
                income = 0.0
            elif month == spec.salary_delay_months + 1:
                income = base_income * (spec.salary_delay_months + 1)

        expenses = base_expenses
        if spec.spending_increase_pct > 0:
            flexible_spend = max(0.0, float(profile.essential_expenses) + float(profile.discretionary_expenses))
            expenses += flexible_spend * spec.spending_increase_pct / 100

        outflow = 0.0
        events_this_month: list[str] = []
        if spec.purchase_month is not None and spec.purchase_month > 0 and month == spec.purchase_month:
            outflow += spec.purchase_amount
            events_this_month.append("Planned purchase")
            purchase_events.append(
                {"month": month, "label": month_label(add_months(start_date, month)), "type": "Purchase", "amount": money(spec.purchase_amount)}
            )

        if spec.emi_monthly > 0 and month <= spec.emi_tenure:
            outflow += spec.emi_monthly
            events_this_month.append("EMI")

        if spec.unexpected_amount > 0 and month == max(1, spec.unexpected_month):
            outflow += spec.unexpected_amount
            events_this_month.append("Unexpected expense")
            purchase_events.append(
                {
                    "month": month,
                    "label": month_label(add_months(start_date, month)),
                    "type": "Unexpected expense",
                    "amount": money(spec.unexpected_amount),
                }
            )

        cash_flow = income - expenses - outflow
        balance += cash_flow
        cashflow_total += cash_flow
        total_outflow += outflow
        min_balance = min(min_balance, balance)

        points.append(
            {
                "month": month,
                "label": month_label(add_months(start_date, month)),
                "date": add_months(start_date, month).isoformat(),
                "savings": money(balance),
                "cash_flow": money(cash_flow),
                "income": money(income),
                "expenses": money(expenses),
                "outflow": money(outflow),
                "event": " · ".join(events_this_month),
            }
        )

    avg_cashflow = cashflow_total / max(horizon_months, 1)
    risk, risk_label = _risk_for(min_balance, balance, target)
    score = _score_track(balance, min_balance, target, avg_cashflow, base_income, spec.emi_interest, spec.purchase_amount)
    cover = (balance / essential) if essential > 0 else 99.0
    emergency_shortfall = max(0.0, target - min_balance)
    purchase_investment = (
        spec.purchase_amount + spec.emi_interest if spec.emi_monthly else spec.purchase_amount
    )

    return {
        "id": spec.key,
        "name": spec.name,
        "short_name": spec.short_name,
        "tagline": spec.tagline,
        "description": spec.description,
        "color": spec.color,
        "is_baseline": spec.is_baseline,
        "path": points,
        "final_savings": money(balance),
        "minimum_savings": money(min_balance),
        "current_savings_after_decision": money(points[0]["savings"]),
        "emergency_shortfall": money(emergency_shortfall),
        "months_of_cover": round(min(max(cover, 0), 99), 1),
        "average_monthly_cash_flow": money(avg_cashflow),
        "total_outflow": money(total_outflow),
        "monthly_commitment": money(spec.emi_monthly),
        "interest_paid": money(spec.emi_interest),
        "total_cost": money(purchase_investment),
        "risk": risk,
        "risk_label": risk_label,
        "score": score,
        "purchase_events": purchase_events,
        "extra_details": spec.extra_details,
    }


def _verdict(spec: TrackSpec, result: dict, baseline: dict, profile: ProfileLike) -> str:
    target = float(profile.emergency_fund_target)
    final = result["final_savings"]
    shortfall = result["emergency_shortfall"]
    if spec.is_baseline:
        return f"Without this purchase, you would end the period with ₹{final:,.0f} in savings."
    if spec.key == "buy_now":
        if shortfall > 0:
            return f"Affordable, but your reserve would dip ₹{shortfall:,.0f} below target before you rebuild it."
        return "You can buy now while keeping your emergency reserve intact."
    if spec.key == "wait_and_save":
        wait_text = spec.extra_details[0].replace("Purchase in month ", "") if spec.extra_details else "a few"
        return f"Waiting {wait_text} months protects your buffer; you end with ₹{final:,.0f} after buying."
    if spec.key == "lighter":
        return f"The smaller purchase keeps more of your safety net intact and still ends at ₹{final:,.0f}."
    if spec.key == "emi":
        return f"The upfront hit is smaller, but the plan adds ₹{result['interest_paid']:,.0f} in interest and a monthly commitment."
    if spec.key == "curveball":
        return f"A surprise expense reduces your ending balance by ₹{max(0, baseline['final_savings'] - final):,.0f} compared with a smooth purchase."
    return result.get("description", "")


def _stress_tests(
    profile: ProfileLike,
    base_spec: TrackSpec,
    horizon_months: int,
    start_date: date,
    unexpected_amount: float,
    unexpected_month: int,
    delayed_salary_months: int,
    spending_increase_pct: float,
    baseline_buy: dict,
) -> list[dict]:
    scenarios: list[tuple[str, str, str, dict]] = [
        (
            "stress_baseline",
            "No surprises",
            "The purchase with stable income and spending.",
            {},
        ),
        (
            "unexpected_expense",
            "Unexpected expense",
            f"A ₹{unexpected_amount:,.0f} one-off cost lands in month {unexpected_month}.",
            {"unexpected_amount": unexpected_amount, "unexpected_month": unexpected_month},
        ),
        (
            "salary_delay",
            "Delayed salary",
            f"Salary arrives late for {delayed_salary_months} month{'s' if delayed_salary_months != 1 else ''}.",
            {"salary_delay_months": delayed_salary_months},
        ),
        (
            "spending_increase",
            "Higher spending",
            f"Monthly expenses rise by {spending_increase_pct:g}%.",
            {"spending_increase_pct": spending_increase_pct},
        ),
        (
            "combined_adverse",
            "Combined curveball",
            "All three pressures arrive in the same future.",
            {
                "unexpected_amount": unexpected_amount,
                "unexpected_month": unexpected_month,
                "salary_delay_months": delayed_salary_months,
                "spending_increase_pct": spending_increase_pct,
            },
        ),
    ]

    results: list[dict] = []
    for key, name, description, overrides in scenarios:
        spec = TrackSpec(
            key=key,
            name=name,
            short_name=name,
            tagline="Stress test",
            description=description,
            color="#94a3b8",
            purchase_month=0,
            purchase_amount=base_spec.purchase_amount,
            emi_down_payment=0,
            emi_monthly=base_spec.emi_monthly,
            emi_tenure=base_spec.emi_tenure,
            emi_interest=base_spec.emi_interest,
            **overrides,
        )
        track = _run_track(profile, spec, horizon_months, start_date)
        results.append(
            {
                "id": key,
                "name": name,
                "description": description,
                "final_savings": track["final_savings"],
                "minimum_savings": track["minimum_savings"],
                "emergency_shortfall": track["emergency_shortfall"],
                "impact_vs_no_surprises": money(track["final_savings"] - baseline_buy["final_savings"]),
                "months_of_cover": track["months_of_cover"],
                "risk": track["risk"],
                "risk_label": track["risk_label"],
            }
        )
    return results


def build_simulation(
    profile: ProfileLike,
    *,
    horizon_months: int = 12,
    purchase_amount: float | None = None,
    wait_months: int = 2,
    cheaper_price: float | None = None,
    emi_down_payment_pct: float = 20.0,
    emi_annual_rate_pct: float = 13.5,
    emi_tenure_months: int = 12,
    unexpected_expense_amount: float = 35000.0,
    unexpected_expense_month: int = 4,
    delayed_salary_months: int = 1,
    spending_increase_pct: float = 12.0,
    start_date: date | None = None,
) -> dict:
    """Compare purchase choices and expose the impact of adverse surprises."""
    horizon_months = max(1, min(int(horizon_months), 60))
    amount = max(0.0, float(purchase_amount if purchase_amount is not None else profile.planned_purchase_amount))
    wait_months = max(1, min(int(wait_months), horizon_months))
    cheaper_price = max(0.0, float(cheaper_price if cheaper_price is not None else amount * 0.8))
    unexpected_expense_amount = max(0.0, float(unexpected_expense_amount))
    unexpected_expense_month = max(1, min(int(unexpected_expense_month), horizon_months))
    delayed_salary_months = max(1, min(int(delayed_salary_months), 6))
    spending_increase_pct = max(0.0, min(float(spending_increase_pct), 100.0))
    start = start_date or date.today()

    emi_down_payment = amount * emi_down_payment_pct / 100
    financed = max(0.0, amount - emi_down_payment)
    emi = calculate_emi(financed, emi_annual_rate_pct, emi_tenure_months)
    monthly_emi = emi["monthly_emi"]

    specs = [
        TrackSpec(
            key="baseline",
            name="No purchase",
            short_name="Baseline",
            tagline="Your current path",
            description="Keep your current savings plan and skip this purchase for now.",
            color="#7C8CA5",
            purchase_month=None,
            is_baseline=True,
        ),
        TrackSpec(
            key="buy_now",
            name="Buy it now",
            short_name="Buy now",
            tagline="Immediate purchase",
            description="Pay the full amount today and keep the full cost out of future months.",
            color="#F5B85A",
            purchase_month=0,
            purchase_amount=amount,
        ),
        TrackSpec(
            key="wait_and_save",
            name=f"Wait {wait_months} month{'s' if wait_months != 1 else ''}",
            short_name="Wait & buy",
            tagline="Protect the buffer",
            description=f"Save for {wait_months} more month{'s' if wait_months != 1 else ''}, then pay upfront.",
            color="#35D39A",
            purchase_month=wait_months,
            purchase_amount=amount,
            extra_details=[f"Purchase in month {wait_months}"],
        ),
        TrackSpec(
            key="lighter",
            name="Choose lighter",
            short_name="Lighter pick",
            tagline="Lower upfront cost",
            description=f"Pick a ₹{cheaper_price:,.0f} alternative instead of the ₹{amount:,.0f} option.",
            color="#6FC3EA",
            purchase_month=0,
            purchase_amount=cheaper_price,
        ),
        TrackSpec(
            key="emi",
            name="Pay by EMI",
            short_name="EMI",
            tagline="Spread the cost",
            description=f"Pay {emi_down_payment_pct:g}% upfront and spread the rest over {emi_tenure_months} months.",
            color="#B69CFF",
            purchase_month=0,
            purchase_amount=amount,
            emi_down_payment=emi_down_payment,
            emi_monthly=monthly_emi,
            emi_tenure=emi_tenure_months,
            emi_interest=emi["total_interest"],
        ),
        TrackSpec(
            key="curveball",
            name="Buy + curveball",
            short_name="Curveball",
            tagline="Stress the decision",
            description=f"Buy today, then absorb a ₹{unexpected_expense_amount:,.0f} surprise in month {unexpected_expense_month}.",
            color="#F07A88",
            purchase_month=0,
            purchase_amount=amount,
            unexpected_amount=unexpected_expense_amount,
            unexpected_month=unexpected_expense_month,
        ),
    ]

    tracks = [_run_track(profile, spec, horizon_months, start) for spec in specs]
    tracks_by_key = {track["id"]: track for track in tracks}
    baseline = tracks_by_key["baseline"]
    buy_now = tracks_by_key["buy_now"]
    for spec, track in zip(specs, tracks):
        track["verdict"] = _verdict(spec, track, baseline, profile)

    purchase_tracks = [track for track in tracks if not track["is_baseline"]]
    preference = {"wait_and_save": 0, "buy_now": 1, "lighter": 2, "emi": 3, "curveball": 4}
    recommended = max(purchase_tracks, key=lambda item: (item["score"], -preference.get(item["id"], 9)))

    derived = derive_profile(profile)
    safe_to_spend = derived["safe_to_spend"]
    extra_needed = max(0.0, amount - safe_to_spend)
    recommendation = {
        "scenario_id": recommended["id"],
        "scenario_name": recommended["short_name"],
        "headline": f"{recommended['short_name']} looks like your most resilient route.",
        "rationale": (
            f"This path keeps your ending balance at ₹{recommended['final_savings']:,.0f} and leaves "
            f"₹{recommended['minimum_savings']:,.0f} at its lowest point. "
            + (
                "You can make the purchase without borrowing."
                if recommended["id"] != "emi"
                else "The upfront cost is lower, but interest and a monthly EMI are part of the trade-off."
            )
        ),
        "safe_to_spend_now": money(safe_to_spend),
        "extra_to_save": money(extra_needed),
        "suggested_monthly_saving": money(min(max(derived["monthly_free_cash_flow"], 0), extra_needed or 0)),
        "total_interest_compared": money(buy_now["interest_paid"]),
    }

    stress_tests = _stress_tests(
        profile,
        specs[1],
        horizon_months,
        start,
        unexpected_expense_amount,
        unexpected_expense_month,
        delayed_salary_months,
        spending_increase_pct,
        buy_now,
    )

    return {
        "generated_at": date.today().isoformat(),
        "horizon_months": horizon_months,
        "purchase_amount": money(amount),
        "scenarios": tracks,
        "recommendation": recommendation,
        "stress_tests": stress_tests,
        "assumptions": {
            "wait_months": wait_months,
            "cheaper_price": money(cheaper_price),
            "emi_down_payment_pct": round(emi_down_payment_pct, 1),
            "emi_annual_rate_pct": round(emi_annual_rate_pct, 2),
            "emi_tenure_months": emi_tenure_months,
            "unexpected_expense_amount": money(unexpected_expense_amount),
            "unexpected_expense_month": unexpected_expense_month,
            "delayed_salary_months": delayed_salary_months,
            "spending_increase_pct": round(spending_increase_pct, 1),
            "investment_return_assumed": 0.0,
        },
    }
