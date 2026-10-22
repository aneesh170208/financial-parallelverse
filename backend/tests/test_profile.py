def test_profile_can_be_created_and_read_back(client, profile_payload):
    initial = client.get("/api/v1/profile")
    assert initial.status_code == 200
    updated = client.put("/api/v1/profile", json=profile_payload)
    assert updated.status_code == 200
    payload = updated.json()
    assert payload["name"] == "Test Saver"
    assert payload["monthly_free_cash_flow"] == 33500
    assert payload["safe_to_spend"] == 40000
    assert payload["health_score"] > 0

    fetched = client.get("/api/v1/profile").json()
    assert fetched["planned_purchase_amount"] == 70000


def test_profile_rejects_negative_money(client, profile_payload):
    profile_payload["current_savings"] = -1
    response = client.put("/api/v1/profile", json=profile_payload)
    assert response.status_code == 422


def test_profile_allows_zero_discretionary_spend(client, profile_payload):
    profile_payload["discretionary_expenses"] = 0
    response = client.put("/api/v1/profile", json=profile_payload)
    assert response.status_code == 200
    assert response.json()["monthly_expenses"] == 37500


def test_demo_profile_can_be_restored(client, profile_payload):
    client.put("/api/v1/profile", json=profile_payload)
    response = client.post("/api/v1/profile/demo")
    assert response.status_code == 200
    assert response.json()["name"] == "Aarav Mehta"


def test_saving_a_plan_updates_profile_and_archives_previous(client, profile_payload):
    client.put("/api/v1/profile", json=profile_payload)
    plan_body = {
        "title": "Camera",
        "amount": 85000,
        "target_date": "2027-03-01",
        "monthly_saving_plan": 15000,
        "notes": "Street photography",
        "update_profile": True,
    }
    first = client.post("/api/v1/purchases/plans", json=plan_body)
    assert first.status_code == 201
    profile = client.get("/api/v1/profile").json()
    assert profile["planned_purchase_amount"] == 85000
    assert profile["expected_purchase_date"] == "2027-03-01"

    plan_body["title"] = "Camera kit"
    second = client.post("/api/v1/purchases/plans", json=plan_body)
    assert second.status_code == 201
    plans = client.get("/api/v1/purchases/plans").json()
    assert len(plans) == 2
    assert plans[0]["status"] == "active"
    assert plans[1]["status"] == "archived"


def test_dashboard_returns_snapshot(client, profile_payload):
    client.put("/api/v1/profile", json=profile_payload)
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["name"] == "Test Saver"
    assert len(data["projection"]) == 13
    assert data["cashflow"]["free_cash_flow"] == 33500
    assert data["purchase"]["amount"] == 70000
    assert "insight" in data
