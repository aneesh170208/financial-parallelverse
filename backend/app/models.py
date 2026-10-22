from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), default="Aarav Mehta")
    monthly_income: Mapped[float] = mapped_column(Float, default=82000)
    current_savings: Mapped[float] = mapped_column(Float, default=220000)
    essential_expenses: Mapped[float] = mapped_column(Float, default=30000)
    discretionary_expenses: Mapped[float] = mapped_column(Float, default=11000)
    existing_debt_payments: Mapped[float] = mapped_column(Float, default=7500)
    emergency_fund_target: Mapped[float] = mapped_column(Float, default=180000)
    planned_purchase_amount: Mapped[float] = mapped_column(Float, default=70000)
    expected_purchase_date: Mapped[date] = mapped_column(Date, default=date.today)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class InstallmentPlan(Base):
    __tablename__ = "installment_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    merchant: Mapped[str] = mapped_column(String(100), default="")
    total_amount: Mapped[float] = mapped_column(Float)
    upfront_payment: Mapped[float] = mapped_column(Float, default=0)
    financed_amount: Mapped[float] = mapped_column(Float)
    monthly_installment: Mapped[float] = mapped_column(Float)
    tenure_months: Mapped[int] = mapped_column(Integer)
    paid_installments: Mapped[int] = mapped_column(Integer, default=0)
    next_due_date: Mapped[date] = mapped_column(Date)
    annual_rate_pct: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    payments: Mapped[list["PaymentRecord"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan", order_by="PaymentRecord.paid_at.desc()"
    )


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("installment_plans.id", ondelete="CASCADE"))
    amount: Mapped[float] = mapped_column(Float)
    due_date: Mapped[date] = mapped_column(Date)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    plan: Mapped[InstallmentPlan] = relationship(back_populates="payments")


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(140), default="Parallel futures analysis")
    horizon_months: Mapped[int] = mapped_column(Integer)
    purchase_amount: Mapped[float] = mapped_column(Float)
    recommended_scenario: Mapped[str] = mapped_column(String(60), default="")
    summary_json: Mapped[str] = mapped_column(Text)
    config_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PurchasePlan(Base):
    __tablename__ = "purchase_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(140))
    amount: Mapped[float] = mapped_column(Float)
    target_date: Mapped[date] = mapped_column(Date)
    monthly_saving_plan: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
