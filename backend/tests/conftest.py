import os
import tempfile
from pathlib import Path

import pytest

# Configure an isolated database before importing the application.
TEST_DB = Path(tempfile.mkdtemp(prefix="parallelverse-tests-")) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["SEED_DEMO"] = "false"
os.environ["ENVIRONMENT"] = "test"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def profile_payload():
    return {
        "name": "Test Saver",
        "monthly_income": 82000,
        "current_savings": 220000,
        "essential_expenses": 30000,
        "discretionary_expenses": 11000,
        "existing_debt_payments": 7500,
        "emergency_fund_target": 180000,
        "planned_purchase_amount": 70000,
        "expected_purchase_date": "2027-02-15",
    }
