from datetime import date

import pytest

from app.services.scenario_engine import build_simulation


class FakeProfile:
    monthly_income = 82000
    current_savings = 220000
    essential_expenses = 30000
    discretionary_expenses = 11000
    existing_debt_payments = 7500
    emergency_fund_target = 180000
    planned_purchase_amount = 70000
    expected_purchase_date = date.today()


def test_build_simulation_returns_six_explainable_futures():
    result = build_simulation(FakeProfile(), horizon_months=12)
    keys = {scenario["id"] for scenario in result["scenarios"]}
    assert keys == {"baseline", "buy_now", "wait_and_save", "lighter", "emi", "curveball"}
    assert all(len(scenario["path"]) == 13 for scenario in result["scenarios"])
    assert all(scenario["verdict"] for scenario in result["scenarios"])
    assert len(result["stress_tests"]) == 5


def test_waiting_preserves_more_liquidity_than_buying_now():
    result = build_simulation(FakeProfile())
    by_id = {scenario["id"]: scenario for scenario in result["scenarios"]}
    assert by_id["wait_and_save"]["minimum_savings"] > by_id["buy_now"]["minimum_savings"]
    assert by_id["buy_now"]["emergency_shortfall"] > 0
    assert by_id["buy_now"]["current_savings_after_decision"] == 150000


def test_emi_route_carries_interest_and_monthly_commitment():
    result = build_simulation(FakeProfile())
    emi = next(item for item in result["scenarios"] if item["id"] == "emi")
    assert emi["interest_paid"] > 0
    assert emi["monthly_commitment"] > 0
    assert emi["current_savings_after_decision"] == 206000


def test_stress_tests_reduce_ending_balance():
    result = build_simulation(FakeProfile())
    by_id = {item["id"]: item for item in result["stress_tests"]}
    assert by_id["stress_baseline"]["impact_vs_no_surprises"] == 0
    assert by_id["unexpected_expense"]["impact_vs_no_surprises"] < 0
    assert by_id["spending_increase"]["impact_vs_no_surprises"] < 0
    assert by_id["combined_adverse"]["impact_vs_no_surprises"] < by_id["unexpected_expense"]["impact_vs_no_surprises"]


def test_salary_delay_creates_temporary_cash_flow_dip_without_changing_eventual_total():
    result = build_simulation(FakeProfile())
    by_id = {item["id"]: item for item in result["stress_tests"]}
    assert by_id["salary_delay"]["final_savings"] == by_id["stress_baseline"]["final_savings"]


def test_simulate_endpoint_persists_run(client, profile_payload):
    client.put("/api/v1/profile", json=profile_payload)
    response = client.post(
        "/api/v1/scenarios/simulate",
        json={
            "title": "Laptop futures",
            "horizon_months": 18,
            "purchase_amount": 65000,
            "wait_months": 3,
            "unexpected_expense_amount": 40000,
            "unexpected_expense_month": 2,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["run_id"] is not None
    assert payload["horizon_months"] == 18
    assert len(payload["scenarios"][0]["path"]) == 19
    assert payload["recommendation"]["scenario_id"] in {"buy_now", "wait_and_save", "lighter", "emi", "curveball"}
    recent = client.get("/api/v1/scenarios/recent")
    assert recent.status_code == 200
    assert recent.json()[0]["title"] == "Laptop futures"


def test_invalid_horizon_is_rejected(client):
    response = client.post("/api/v1/scenarios/simulate", json={"horizon_months": 0})
    assert response.status_code == 422
