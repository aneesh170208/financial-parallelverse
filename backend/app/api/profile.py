from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ProfileBase, ProfileOut, profile_response
from ..services.seed import demo_profile, ensure_profile

router = APIRouter(prefix="/profile", tags=["Financial profile"])


@router.get("", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)) -> ProfileOut:
    return profile_response(ensure_profile(db))


@router.put("", response_model=ProfileOut)
def update_profile(payload: ProfileBase, db: Session = Depends(get_db)) -> ProfileOut:
    profile = ensure_profile(db)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile_response(profile)


@router.post("/demo", response_model=ProfileOut)
def restore_demo_profile(db: Session = Depends(get_db)) -> ProfileOut:
    profile = ensure_profile(db)
    fresh = demo_profile()
    for column in (
        "name",
        "monthly_income",
        "current_savings",
        "essential_expenses",
        "discretionary_expenses",
        "existing_debt_payments",
        "emergency_fund_target",
        "planned_purchase_amount",
        "expected_purchase_date",
    ):
        setattr(profile, column, getattr(fresh, column))
    db.commit()
    db.refresh(profile)
    return profile_response(profile)
