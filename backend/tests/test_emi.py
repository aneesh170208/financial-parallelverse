from datetime import date

import pytest

from app.services.emi_calculator import calculate_emi


class FakeProfile:
    monthly_income = 82000
    current_savings = 220000
    essential_expenses = 30000
    discretionary_expenses = 11000
    existing_debt_payments = 7500
    emergency_fund_target = 180000
    planned_purchase_amount = 70000
    expected_purchase_date = date.today()


def test_zero_interest_emi():
    result = calculate_emi(56000, 0, 12)
    assert result["monthly_emi"] == pytest.approx(4666.67, abs=0.01)
    assert result["total_interest"] == pytest.approx(0, abs=0.01)
    assert result["schedule"][-1]["balance"] == 0
    assert len(result["schedule"]) == 12


def test_amortization_fully_repays_principal():
    result = calculate_emi(100000, 14, 18, processing_fee_pct=1)
    schedule = result["schedule"]
    assert len(schedule) == 18
    assert sum(item["principal"] for item in schedule) == pytest.approx(100000, abs=1)
    assert result["total_interest"] > 0
    assert result["processing_fee"] == 1000
    assert schedule[-1]["balance"] == 0


def test_emi_affordability_context():
    result = calculate_emi(56000, 13.5, 12, profile=FakeProfile())
    assert result["affordability"]["status"] in {"comfortable", "cautious"}
    assert result["affordability"]["free_cash_flow_after_emi"] == pytest.approx(
        33500 - result["monthly_emi"], abs=0.02
    )


def test_high_emi_is_flagged(client):
    response = client.post(
        "/api/v1/emi/calculate",
        json={"principal": 500000, "annual_rate_pct": 18, "tenure_months": 12},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["affordability"]["status"] in {"stretched", "unaffordable"}
    assert payload["total_cost"] > payload["principal"]


def test_invalid_emi_terms_are_rejected(client):
    response = client.post(
        "/api/v1/emi/calculate",
        json={"principal": -100, "annual_rate_pct": 12, "tenure_months": 12},
    )
    assert response.status_code == 422
