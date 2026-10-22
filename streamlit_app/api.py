"""Typed-ish HTTP client for the Financial Parallelverse FastAPI service."""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from typing import Any

import httpx


def _read_api_url() -> str:
    """Use the environment first, then the repository .env for local runs."""
    configured = os.environ.get("API_URL")
    if configured:
        return configured

    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.is_file():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped.startswith("API_URL=") and not stripped.startswith("#"):
                return stripped.split("=", 1)[1].strip().strip("\"'")
    return "http://127.0.0.1:8000/api/v1"


API_URL = _read_api_url().rstrip("/")


class ApiError(RuntimeError):
    """A user-presentable API or connectivity failure."""


def _detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return f"The API returned HTTP {response.status_code}."
    detail = payload.get("detail") if isinstance(payload, dict) else None
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        messages = []
        for item in detail:
            if isinstance(item, dict):
                message = item.get("msg") or item.get("type")
                location = ".".join(str(part) for part in item.get("loc", []) if part != "body")
                if message and location:
                    messages.append(f"{location}: {message}")
                elif message:
                    messages.append(str(message))
        if messages:
            return "; ".join(messages)
    return f"The API returned HTTP {response.status_code}."


def _request(method: str, path: str, **kwargs: Any) -> Any:
    url = f"{API_URL}{path}"
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.request(method, url, **kwargs)
    except httpx.RequestError as exc:
        raise ApiError(
            f"Could not reach the FastAPI server at {API_URL}. "
            "Make sure it is running, then try again."
        ) from exc

    if response.status_code >= 400:
        raise ApiError(_detail(response))
    if response.status_code == 204:
        return None
    try:
        return response.json()
    except ValueError as exc:
        raise ApiError("The API returned an unexpected response.") from exc


def _iso(value: date | str) -> str:
    return value.isoformat() if isinstance(value, date) else value


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------


def health() -> dict:
    return _request("GET", "/health")


def get_profile() -> dict:
    return _request("GET", "/profile")


def get_dashboard() -> dict:
    return _request("GET", "/dashboard")


def recent_simulations(limit: int = 5) -> list[dict]:
    return _request("GET", "/scenarios/recent", params={"limit": limit})


def list_purchase_plans() -> list[dict]:
    return _request("GET", "/purchases/plans")


def list_installments() -> dict:
    return _request("GET", "/installments")


def get_reminders() -> list[dict]:
    return _request("GET", "/installments/reminders")


# ---------------------------------------------------------------------------
# Mutations and calculations
# ---------------------------------------------------------------------------


def update_profile(payload: dict) -> dict:
    body = {**payload, "expected_purchase_date": _iso(payload["expected_purchase_date"])}
    return _request("PUT", "/profile", json=body)


def reset_demo_profile() -> dict:
    return _request("POST", "/profile/demo")


def simulate(payload: dict) -> dict:
    return _request("POST", "/scenarios/simulate", json=payload)


def assess_purchase(payload: dict) -> dict:
    body = {**payload, "target_date": _iso(payload["target_date"])}
    return _request("POST", "/purchases/assess", json=body)


def create_purchase_plan(payload: dict) -> dict:
    body = {**payload, "target_date": _iso(payload["target_date"])}
    return _request("POST", "/purchases/plans", json=body)


def delete_purchase_plan(plan_id: int) -> None:
    _request("DELETE", f"/purchases/plans/{plan_id}")


def calculate_emi(payload: dict) -> dict:
    return _request("POST", "/emi/calculate", json=payload)


def create_installment(payload: dict) -> dict:
    body = {**payload, "next_due_date": _iso(payload["next_due_date"])}
    return _request("POST", "/installments", json=body)


def pay_installment(plan_id: int) -> dict:
    return _request("PATCH", f"/installments/{plan_id}/pay")


def delete_installment(plan_id: int) -> None:
    _request("DELETE", f"/installments/{plan_id}")
