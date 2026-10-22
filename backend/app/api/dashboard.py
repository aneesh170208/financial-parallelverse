import math
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import InstallmentPlan, PurchasePlan, SimulationRun
from ..schemas import DashboardOut, profile_response
from ..services.affordability import build_insight
from ..services.financial_engine import baseline_points, cashflow_breakdown
from ..services.reminder_service import due_state, serialize_all
from ..services.seed import ensure_profile

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)) -> dict:
    profile = ensure_profile(db)
    profile_data = profile_response(profile)
    latest_plan = db.scalar(
        select(PurchasePlan)
        .where(PurchasePlan.status == "active")
        .order_by(PurchasePlan.created_at.desc())
    )
    amount = latest_plan.amount if latest_plan else profile.planned_purchase_amount
    target = latest_plan.target_date if latest_plan else profile.expected_purchase_date
    derived = profile_data.model_dump()
    safe_to_spend = derived["safe_to_spend"]
    gap = max(0.0, amount - safe_to_spend)
    fcf = derived["monthly_free_cash_flow"]
    months_to_purchase = 0 if gap <= 0 else (math.ceil(gap / fcf) if fcf > 0 else None)
    readiness = min(100.0, safe_to_spend / amount * 100) if amount > 0 else 100.0
    days_until = (target - date.today()).days

    plan_rows = list(
        db.scalars(
            select(InstallmentPlan)
            .where(InstallmentPlan.status == "active")
            .order_by(InstallmentPlan.next_due_date.asc())
        ).all()
    )
    serialized_plans = serialize_all(plan_rows)
    upcoming = [
        {
            "id": item["id"],
            "name": item["name"],
            "merchant": item["merchant"],
            "amount": item["monthly_installment"],
            "due_date": item["next_due_date"],
            "days_until_due": item["days_until_due"],
            "due_status": item["due_status"],
        }
        for item in serialized_plans[:3]
    ]

    recent = db.scalar(select(SimulationRun).order_by(SimulationRun.created_at.desc()).limit(1))
    recent_data = None
    if recent:
        recent_data = {
            "id": recent.id,
            "title": recent.title,
            "purchase_amount": recent.purchase_amount,
            "recommended_scenario": recent.recommended_scenario,
            "created_at": recent.created_at,
        }

    return {
        "profile": profile_data,
        "cashflow": cashflow_breakdown(profile),
        "projection": baseline_points(profile, 12),
        "purchase": {
            "title": latest_plan.title if latest_plan else "Your next planned purchase",
            "amount": amount,
            "target_date": target,
            "days_until_target": days_until,
            "safe_to_spend": safe_to_spend,
            "gap": gap,
            "readiness_pct": round(readiness, 1),
            "months_to_purchase": months_to_purchase,
            "saved_plan_id": latest_plan.id if latest_plan else None,
            "monthly_saving_plan": latest_plan.monthly_saving_plan if latest_plan else 0,
        },
        "upcoming_installments": upcoming,
        "recent_simulation": recent_data,
        "insight": build_insight(profile, derived),
        "monthly_installment_commitment": round(sum(plan.monthly_installment for plan in plan_rows), 2),
        "active_installments": len(plan_rows),
    }
