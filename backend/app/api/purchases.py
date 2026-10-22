from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PurchasePlan
from ..schemas import (
    PurchaseAssessmentRequest,
    PurchaseAssessmentResponse,
    PurchasePlanCreate,
    PurchasePlanOut,
)
from ..services.purchase_planner import assess_purchase
from ..services.seed import ensure_profile

router = APIRouter(prefix="/purchases", tags=["Purchase planner"])


@router.post("/assess", response_model=PurchaseAssessmentResponse)
def assess(payload: PurchaseAssessmentRequest, db: Session = Depends(get_db)) -> dict:
    profile = ensure_profile(db)
    amount = payload.amount if payload.amount is not None else profile.planned_purchase_amount
    target = payload.target_date or profile.expected_purchase_date
    return assess_purchase(profile, amount, target, payload.title)


@router.get("/plans", response_model=list[PurchasePlanOut])
def list_plans(db: Session = Depends(get_db)) -> list[PurchasePlan]:
    return list(db.scalars(select(PurchasePlan).order_by(PurchasePlan.created_at.desc())).all())


@router.post("/plans", response_model=PurchasePlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PurchasePlanCreate, db: Session = Depends(get_db)) -> PurchasePlan:
    active_plans = db.scalars(select(PurchasePlan).where(PurchasePlan.status == "active")).all()
    for plan in active_plans:
        plan.status = "archived"

    plan = PurchasePlan(
        title=payload.title,
        amount=payload.amount,
        target_date=payload.target_date,
        monthly_saving_plan=payload.monthly_saving_plan,
        notes=payload.notes,
        status="active",
    )
    db.add(plan)

    if payload.update_profile:
        profile = ensure_profile(db)
        profile.planned_purchase_amount = payload.amount
        profile.expected_purchase_date = payload.target_date
        db.add(profile)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)) -> Response:
    plan = db.get(PurchasePlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Purchase plan not found")
    db.delete(plan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
