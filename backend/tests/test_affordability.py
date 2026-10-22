from datetime import date, timedelta

from app.services.affordability import build_insight, derive_profile
from app.services.purchase_planner import assess_purchase
from app.main import app
from fastapi.testclient import TestClient


class FakeProfile:
    monthly_income = 82000
    current_savings = 220000
    essential_expenses = 30000
    discretionary_expenses = 11000
    existing_debt_payments = 7500
    emergency_fund_target = 180000
    planned_purchase_amount = 70000
    expected_purchase_date = date.today() + timedelta(days=90)


def test_derived_metrics_protect_emergency_fund():
    derived = derive_profile(FakeProfile())
    assert derived["monthly_free_cash_flow"] == 33500
    assert derived["safe_to_spend"] == 40000
    assert derived["purchase_readiness_pct"] == 57.1
    assert derived["emergency_gap"] == 0
    assert 0 <= derived["health_score"] <= 100


def test_insight_prefers_emergency_action_when_short():
    profile = FakeProfile()
    profile.current_savings = 100000
    derived = derive_profile(profile)
    insight = build_insight(profile, derived)
    assert "emergency fund" in insight.lower()


def test_purchase_assessment_marks_on_track():
    result = assess_purchase(FakeProfile(), 70000)
    assert result["status"] == "on_track"
    assert result["on_track"] is True
    assert result["gap"] == 30000
    assert result["months_to_goal"] == 1
    assert len(result["factors"]) == 5
    assert result["trajectory"][0]["label"] == "Now"


def test_assessment_requires_profile_to_be_adjusted_for_impossible_timeline():
    profile = FakeProfile()
    profile.expected_purchase_date = date.today() + timedelta(days=5)
    result = assess_purchase(profile, 350000)
    assert result["status"] == "needs_adjustment"
    assert result["on_track"] is False


def test_purchase_assessment_endpoint(client, profile_payload):
    client.put("/api/v1/profile", json=profile_payload)
    response = client.post("/api/v1/purchases/assess", json={"amount": 70000, "title": "Laptop"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Laptop"
    assert payload["safe_to_spend"] == 40000
    assert payload["status"] in {"ready", "on_track", "needs_adjustment", "blocked"}
