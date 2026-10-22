"""Installment presentation and reminder logic."""

from __future__ import annotations

from datetime import date
from typing import Iterable

from ..models import InstallmentPlan


def due_state(plan: InstallmentPlan, today: date | None = None) -> tuple[str, int]:
    today = today or date.today()
    if plan.status == "completed":
        return "completed", 0
    days = (plan.next_due_date - today).days
    if days < 0:
        return "overdue", days
    if days <= 7:
        return "due_soon", days
    return "upcoming", days


def serialize_installment(plan: InstallmentPlan, today: date | None = None) -> dict:
    today = today or date.today()
    state, days = due_state(plan, today)
    remaining = max(0, plan.tenure_months - plan.paid_installments)
    outstanding = plan.monthly_installment * remaining
    progress = (plan.paid_installments / plan.tenure_months * 100) if plan.tenure_months else 0
    return {
        "id": plan.id,
        "name": plan.name,
        "merchant": plan.merchant,
        "total_amount": round(plan.total_amount, 2),
        "upfront_payment": round(plan.upfront_payment, 2),
        "financed_amount": round(plan.financed_amount, 2),
        "monthly_installment": round(plan.monthly_installment, 2),
        "tenure_months": plan.tenure_months,
        "paid_installments": plan.paid_installments,
        "remaining_installments": remaining,
        "outstanding_amount": round(outstanding, 2),
        "next_due_date": plan.next_due_date.isoformat(),
        "days_until_due": days,
        "due_status": state,
        "progress_pct": round(progress, 1),
        "annual_rate_pct": plan.annual_rate_pct,
        "notes": plan.notes,
        "status": plan.status,
        "created_at": plan.created_at.isoformat(),
        "payments": [
            {
                "id": payment.id,
                "amount": round(payment.amount, 2),
                "due_date": payment.due_date.isoformat(),
                "paid_at": payment.paid_at.isoformat(),
            }
            for payment in sorted(plan.payments, key=lambda item: item.paid_at, reverse=True)[:8]
        ],
    }


def serialize_all(plans: Iterable[InstallmentPlan], today: date | None = None) -> list[dict]:
    today = today or date.today()
    serialized = [serialize_installment(plan, today) for plan in plans]
    status_rank = {"overdue": 0, "due_soon": 1, "upcoming": 2, "completed": 3}
    return sorted(serialized, key=lambda item: (status_rank.get(item["due_status"], 4), item["next_due_date"]))


def build_reminders(plans: Iterable[InstallmentPlan], today: date | None = None, window_days: int = 14) -> list[dict]:
    today = today or date.today()
    reminders = []
    for plan in plans:
        if plan.status != "active":
            continue
        state, days = due_state(plan, today)
        if state in {"overdue", "due_soon"} or 0 <= days <= window_days:
            reminders.append(
                {
                    "plan_id": plan.id,
                    "name": plan.name,
                    "merchant": plan.merchant,
                    "amount": round(plan.monthly_installment, 2),
                    "due_date": plan.next_due_date.isoformat(),
                    "days_until_due": days,
                    "due_status": state,
                }
            )
    return sorted(reminders, key=lambda item: item["days_until_due"])
