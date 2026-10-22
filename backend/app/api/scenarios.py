import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SimulationRun
from ..schemas import SimulationRequest, SimulationResponse
from ..services.scenario_engine import build_simulation
from ..services.seed import ensure_profile

router = APIRouter(prefix="/scenarios", tags=["Parallel futures"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest, db: Session = Depends(get_db)) -> SimulationResponse:
    profile = ensure_profile(db)
    result = build_simulation(
        profile,
        horizon_months=payload.horizon_months,
        purchase_amount=payload.purchase_amount,
        wait_months=payload.wait_months,
        cheaper_price=payload.cheaper_price,
        emi_down_payment_pct=payload.emi_down_payment_pct,
        emi_annual_rate_pct=payload.emi_annual_rate_pct,
        emi_tenure_months=payload.emi_tenure_months,
        unexpected_expense_amount=payload.unexpected_expense_amount,
        unexpected_expense_month=payload.unexpected_expense_month,
        delayed_salary_months=payload.delayed_salary_months,
        spending_increase_pct=payload.spending_increase_pct,
    )
    summary = {
        "recommendation": result["recommendation"],
        "scenarios": [
            {
                "id": scenario["id"],
                "name": scenario["name"],
                "final_savings": scenario["final_savings"],
                "risk_label": scenario["risk_label"],
            }
            for scenario in result["scenarios"]
        ],
    }
    run = SimulationRun(
        title=payload.title,
        horizon_months=result["horizon_months"],
        purchase_amount=result["purchase_amount"],
        recommended_scenario=result["recommendation"]["scenario_name"],
        summary_json=json.dumps(summary),
        config_json=payload.model_dump_json(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return SimulationResponse.model_validate({**result, "run_id": run.id})


@router.get("/recent")
def recent_simulations(limit: int = 5, db: Session = Depends(get_db)) -> list[dict]:
    runs = db.scalars(select(SimulationRun).order_by(SimulationRun.created_at.desc()).limit(max(1, min(limit, 20)))).all()
    return [
        {
            "id": run.id,
            "title": run.title,
            "horizon_months": run.horizon_months,
            "purchase_amount": run.purchase_amount,
            "recommended_scenario": run.recommended_scenario,
            "created_at": run.created_at.isoformat(),
        }
        for run in runs
    ]
