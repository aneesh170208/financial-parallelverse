def test_health_reports_service_and_database(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "connected"
    assert payload["service"] == "Financial Parallelverse API"


def test_api_information(client):
    response = client.get("/api")
    assert response.status_code == 200
    assert response.json()["health"] == "/api/v1/health"
