"""Unit tests for the Streamlit-side preview math and formatting."""

from __future__ import annotations

from datetime import date

import pytest

from app.services.affordability import derive_profile
from streamlit_app.finance import add_months, derive_preview
from streamlit_app.ui import inr, risk_tone


class ProfileStub:
    def __init__(self, **values):
        self.monthly_income = values["monthly_income"]
        self.current_savings = values["current_savings"]
        self.essential_expenses = values["essential_expenses"]
        self.discretionary_expenses = values["discretionary_expenses"]
        self.existing_debt_payments = values["existing_debt_payments"]
        self.emergency_fund_target = values["emergency_fund_target"]
        self.planned_purchase_amount = values["planned_purchase_amount"]
        self.expected_purchase_date = values.get("expected_purchase_date", date.today())


@pytest.mark.parametrize(
    "values",
    [
        {
            "monthly_income": 82000,
            "current_savings": 220000,
            "essential_expenses": 30000,
            "discretionary_expenses": 11000,
            "existing_debt_payments": 7500,
            "emergency_fund_target": 180000,
            "planned_purchase_amount": 70000,
        },
        {
            "monthly_income": 45000,
            "current_savings": 90000,
            "essential_expenses": 28000,
            "discretionary_expenses": 9000,
            "existing_debt_payments": 12000,
            "emergency_fund_target": 120000,
            "planned_purchase_amount": 250000,
        },
        {
            "monthly_income": 0,
            "current_savings": 0,
            "essential_expenses": 15000,
            "discretionary_expenses": 0,
            "existing_debt_payments": 0,
            "emergency_fund_target": 50000,
            "planned_purchase_amount": 0,
        },
    ],
)
def test_preview_matches_backend_derived_metrics(values):
    today = date(2026, 10, 22)
    server = derive_profile(ProfileStub(**values))
    preview = derive_preview(**values, today=today)

    for key in (
        "monthly_expenses",
        "monthly_free_cash_flow",
        "savings_rate_pct",
        "debt_to_income_pct",
        "fixed_commitment_ratio_pct",
        "emergency_coverage_months",
        "emergency_gap",
        "safe_to_spend",
        "purchase_readiness_pct",
        "purchase_gap",
        "months_to_purchase",
        "health_score",
        "health_label",
    ):
        assert preview[key] == server[key], key


def test_emergency_fund_is_never_counted_as_safe_to_spend():
    preview = derive_preview(
        monthly_income=82000,
        current_savings=100000,
        essential_expenses=30000,
        discretionary_expenses=10000,
        existing_debt_payments=5000,
        emergency_fund_target=180000,
        planned_purchase_amount=70000,
        today=date(2026, 10, 22),
    )
    assert preview["safe_to_spend"] == 0
    assert preview["emergency_gap"] == 80000
    assert preview["purchase_gap"] == 70000


def test_add_months_clamps_to_month_end():
    assert add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert add_months(date(2024, 1, 31), 1) == date(2024, 2, 29)
    assert add_months(date(2026, 3, 15), -1) == date(2026, 2, 15)


def test_indian_currency_formatting():
    assert inr(220000) == "₹2,20,000"
    assert inr(10000000) == "₹1,00,00,000"
    assert inr(-1500) == "-₹1,500"
    assert inr(220000, compact=True) == "₹2.2 L"
    assert inr(5014.91, decimals=2) == "₹5,014.91"


@pytest.mark.parametrize(
    ("label", "tone"),
    [
        ("Resilient", "positive"),
        ("Stable", "blue"),
        ("Watchful", "warning"),
        ("Fragile", "danger"),
        ("Critical", "danger"),
        ("Comfortable", "positive"),
        ("Cautious", "warning"),
        ("Stretched", "warning"),
        ("Unaffordable", "danger"),
    ],
)
def test_risk_tones_cover_backend_labels(label, tone):
    assert risk_tone(label) == tone
