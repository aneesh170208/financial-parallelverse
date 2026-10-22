"""Idempotent demo data for local development."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import InstallmentPlan, Profile, PurchasePlan, SimulationRun
from .date_utils import add_months
from .scenario_engine import build_simulation


def demo_profile() -> Profile:
    today = date.today()
    return Profile(
        name="Aarav Mehta",
        monthly_income=82000,
        current_savings=220000,
        essential_expenses=30000,
        discretionary_expenses=11000,
        existing_debt_payments=7500,
        emergency_fund_target=180000,
        planned_purchase_amount=70000,
        expected_purchase_date=add_months(today, 3),
    )


def _seed_installments(db: Session, today: date) -> None:
    plans = [
        InstallmentPlan(
            name="iPad Air for coursework",
            merchant="Croma",
            total_amount=64900,
            upfront_payment=9900,
            financed_amount=55000,
            monthly_installment=4583.33,
            tenure_months=12,
            paid_installments=7,
            next_due_date=today + timedelta(days=4),
            annual_rate_pct=0,
            notes="No-cost EMI. Keep the payment buffer ready.",
            status="active",
        ),
        InstallmentPlan(
            name="Annual fitness membership",
            merchant="Cult.fit",
            total_amount=12999,
            upfront_payment=1999,
            financed_amount=11000,
            monthly_installment=1833.33,
            tenure_months=6,
            paid_installments=4,
            next_due_date=today + timedelta(days=17),
            annual_rate_pct=0,
            notes="Renews annually. Decide before the next billing cycle.",
            status="active",
        ),
    ]
    db.add_all(plans)


def seed_demo_data(db: Session) -> bool:
    """Create polished demo data once. Never overwrites an existing profile."""
    existing = db.scalar(select(Profile).limit(1))
    if existing is not None:
        return False

    today = date.today()
    profile = demo_profile()
    db.add(profile)
    db.flush()

    _seed_installments(db, today)

    simulation = build_simulation(profile, horizon_months=12)
    summary = {
        "recommendation": simulation["recommendation"],
        "scenarios": [
            {
                "id": item["id"],
                "name": item["name"],
                "final_savings": item["final_savings"],
                "risk_label": item["risk_label"],
            }
            for item in simulation["scenarios"]
        ],
    }
    config = {
        "horizon_months": 12,
        "purchase_amount": profile.planned_purchase_amount,
        "wait_months": 2,
    }
    db.add(
        SimulationRun(
            title="New laptop for work",
            horizon_months=12,
            purchase_amount=profile.planned_purchase_amount,
            recommended_scenario=simulation["recommendation"]["scenario_name"],
            summary_json=json.dumps(summary),
            config_json=json.dumps(config),
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
    )
    db.add(
        PurchasePlan(
            title="New laptop for work",
            amount=profile.planned_purchase_amount,
            target_date=profile.expected_purchase_date,
            monthly_saving_plan=10000,
            notes="Protect the emergency fund and compare a lighter option before buying.",
            status="active",
        )
    )
    db.commit()
    return True


def ensure_profile(db: Session) -> Profile:
    profile = db.scalar(select(Profile).limit(1))
    if profile is None:
        profile = demo_profile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile
