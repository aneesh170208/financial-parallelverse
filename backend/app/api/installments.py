from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import InstallmentPlan, PaymentRecord
from ..schemas import (
    InstallmentCollectionOut,
    InstallmentOut,
    InstallmentPlanCreate,
    ReminderOut,
)
from ..services.date_utils import add_months
from ..services.reminder_service import build_reminders, serialize_all, serialize_installment

router = APIRouter(prefix="/installments", tags=["Installment tracker"])


def _plans(db: Session) -> list[InstallmentPlan]:
    return list(
        db.scalars(
            select(InstallmentPlan)
            .options(selectinload(InstallmentPlan.payments))
            .order_by(InstallmentPlan.created_at.desc())
        ).all()
    )


def _collection(plans: list[InstallmentPlan], today: date | None = None) -> dict:
    today = today or date.today()
    serialized = serialize_all(plans, today)
    active = [item for item in serialized if item["status"] == "active"]
    reminders = build_reminders([plan for plan in plans if plan.status == "active"], today)
    next_due = min((item["next_due_date"] for item in active), default=None)
    return {
        "summary": {
            "active_plans": len(active),
            "monthly_commitment": round(sum(item["monthly_installment"] for item in active), 2),
            "outstanding_total": round(sum(item["outstanding_amount"] for item in active), 2),
            "next_due_date": next_due,
            "overdue_count": sum(1 for item in active if item["due_status"] == "overdue"),
            "due_soon_count": sum(1 for item in active if item["due_status"] == "due_soon"),
        },
        "plans": serialized,
        "reminders": reminders,
    }


@router.get("", response_model=InstallmentCollectionOut)
def list_installments(db: Session = Depends(get_db)) -> dict:
    return _collection(_plans(db))


@router.get("/reminders", response_model=list[ReminderOut])
def reminders(db: Session = Depends(get_db)) -> list[dict]:
    return build_reminders([plan for plan in _plans(db) if plan.status == "active"])


@router.post("", response_model=InstallmentOut, status_code=status.HTTP_201_CREATED)
def create_installment(payload: InstallmentPlanCreate, db: Session = Depends(get_db)) -> dict:
    financed = payload.total_amount - payload.upfront_payment
    is_complete = payload.paid_installments >= payload.tenure_months
    plan = InstallmentPlan(
        name=payload.name,
        merchant=payload.merchant,
        total_amount=payload.total_amount,
        upfront_payment=payload.upfront_payment,
        financed_amount=financed,
        monthly_installment=payload.monthly_installment,
        tenure_months=payload.tenure_months,
        paid_installments=payload.paid_installments,
        next_due_date=payload.next_due_date,
        annual_rate_pct=payload.annual_rate_pct,
        notes=payload.notes,
        status="completed" if is_complete else "active",
    )
    db.add(plan)
    db.flush()

    # Create a lightweight audit trail for installments the user says are
    # already paid, without pretending to know exact bank timestamps.
    for index in range(payload.paid_installments):
        due = add_months(payload.next_due_date, -(payload.paid_installments - index))
        paid_at = datetime.combine(due, time(hour=10), tzinfo=timezone.utc)
        db.add(
            PaymentRecord(
                plan_id=plan.id,
                amount=payload.monthly_installment,
                due_date=due,
                paid_at=paid_at,
            )
        )
    db.commit()
    db.refresh(plan)
    return serialize_installment(plan)


@router.patch("/{plan_id}/pay", response_model=InstallmentOut)
def pay_installment(plan_id: int, db: Session = Depends(get_db)) -> dict:
    plan = db.scalar(
        select(InstallmentPlan)
        .where(InstallmentPlan.id == plan_id)
        .options(selectinload(InstallmentPlan.payments))
    )
    if plan is None:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    if plan.status == "completed" or plan.paid_installments >= plan.tenure_months:
        raise HTTPException(status_code=409, detail="This installment plan is already complete")

    db.add(
        PaymentRecord(
            plan_id=plan.id,
            amount=plan.monthly_installment,
            due_date=plan.next_due_date,
            paid_at=datetime.now(timezone.utc),
        )
    )
    plan.paid_installments += 1
    if plan.paid_installments >= plan.tenure_months:
        plan.status = "completed"
    else:
        plan.next_due_date = add_months(plan.next_due_date, 1)
    db.commit()
    db.refresh(plan)
    return serialize_installment(plan)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_installment(plan_id: int, db: Session = Depends(get_db)) -> Response:
    plan = db.get(InstallmentPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    db.delete(plan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
