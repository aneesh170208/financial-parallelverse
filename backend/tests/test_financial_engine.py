from types import SimpleNamespace

import pytest

from app.services.financial_engine import baseline_points, cashflow_breakdown, free_cash_flow


@pytest.fixture()
def profile():
    return SimpleNamespace(
        monthly_income=82000,
        current_savings=220000,
        essential_expenses=30000,
        discretionary_expenses=11000,
        existing_debt_payments=7500,
        emergency_fund_target=180000,
        planned_purchase_amount=70000,
    )


def test_free_cash_flow_is_income_minus_outgoings(profile):
    assert free_cash_flow(profile) == 33500


def test_cashflow_breakdown_totals(profile):
    breakdown = cashflow_breakdown(profile)
    assert breakdown["income"] == 82000
    assert breakdown["free_cash_flow"] == 82000 - 30000 - 11000 - 7500


def test_baseline_projection_compounds_monthly_savings(profile):
    points = baseline_points(profile, 3)
    assert len(points) == 4
    assert points[0]["label"] == "Now"
    assert points[0]["savings"] == 220000
    assert points[1]["savings"] == 253500
    assert points[3]["savings"] == 320500
    assert all(point["outflow"] == 0 for point in points)


def test_baseline_accepts_zero_month_balance(profile):
    profile.current_savings = 0
    assert baseline_points(profile, 1)[0]["savings"] == 0
