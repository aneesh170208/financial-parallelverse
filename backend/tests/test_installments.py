from datetime import date, timedelta


def installment_payload(**overrides):
    payload = {
        "name": "Mechanical keyboard",
        "merchant": "Keychron",
        "total_amount": 18000,
        "upfront_payment": 3000,
        "monthly_installment": 2500,
        "tenure_months": 6,
        "paid_installments": 0,
        "next_due_date": (date.today() + timedelta(days=3)).isoformat(),
        "annual_rate_pct": 0,
    }
    payload.update(overrides)
    return payload


def test_create_and_list_installment(client):
    created = client.post("/api/v1/installments", json=installment_payload())
    assert created.status_code == 201
    plan = created.json()
    assert plan["financed_amount"] == 15000
    assert plan["remaining_installments"] == 6
    assert plan["due_status"] == "due_soon"

    listing = client.get("/api/v1/installments")
    assert listing.status_code == 200
    data = listing.json()
    assert data["summary"]["active_plans"] == 1
    assert data["summary"]["due_soon_count"] == 1
    assert data["summary"]["monthly_commitment"] == 2500


def test_pay_installment_advances_due_date_and_creates_audit_record(client):
    created = client.post("/api/v1/installments", json=installment_payload()).json()
    paid = client.patch(f"/api/v1/installments/{created['id']}/pay")
    assert paid.status_code == 200
    plan = paid.json()
    assert plan["paid_installments"] == 1
    assert plan["remaining_installments"] == 5
    assert plan["next_due_date"] != created["next_due_date"]
    assert len(plan["payments"]) == 1


def test_complete_plan_cannot_be_paid_again(client):
    created = client.post(
        "/api/v1/installments",
        json=installment_payload(tenure_months=1, paid_installments=1, monthly_installment=15000),
    )
    assert created.status_code == 201
    plan = created.json()
    assert plan["status"] == "completed"
    repeat = client.patch(f"/api/v1/installments/{plan['id']}/pay")
    assert repeat.status_code == 409


def test_invalid_installment_values_are_rejected(client):
    response = client.post(
        "/api/v1/installments",
        json=installment_payload(upfront_payment=20000),
    )
    assert response.status_code == 422


def test_delete_installment(client):
    created = client.post("/api/v1/installments", json=installment_payload()).json()
    response = client.delete(f"/api/v1/installments/{created['id']}")
    assert response.status_code == 204
    listing = client.get("/api/v1/installments").json()
    assert listing["plans"] == []


def test_reminders_only_include_actionable_dues(client):
    client.post("/api/v1/installments", json=installment_payload())
    response = client.get("/api/v1/installments/reminders")
    assert response.status_code == 200
    reminders = response.json()
    assert len(reminders) == 1
    assert reminders[0]["due_status"] == "due_soon"
