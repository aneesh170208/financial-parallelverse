from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import EMIRequest, EMIResponse
from ..services.emi_calculator import calculate_emi
from ..services.seed import ensure_profile

router = APIRouter(prefix="/emi", tags=["EMI calculator"])


@router.post("/calculate", response_model=EMIResponse)
def calculate(payload: EMIRequest, db: Session = Depends(get_db)) -> dict:
    profile = ensure_profile(db)
    return calculate_emi(
        principal=payload.principal,
        annual_rate_pct=payload.annual_rate_pct,
        tenure_months=payload.tenure_months,
        processing_fee_pct=payload.processing_fee_pct,
        processing_fee_fixed=payload.processing_fee_fixed,
        profile=profile,
    )
