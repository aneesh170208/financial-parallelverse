# Financial Parallelverse

A local-first fintech workspace for exploring the **financial consequences of a purchase** before making it. Compare six possible futures, protect an emergency reserve, plan a purchase, understand EMI costs, and track existing installments — all in one deterministic, explainable demo app.

Built with **Streamlit** for the interface and **FastAPI + SQLAlchemy + SQLite** for the API and persistence. All application source is Python: there are no React, TypeScript, CSS or standalone HTML files in the current tree.

---

## Why this exists

Most purchase calculators answer “what will the EMI be?”. Financial Parallelverse asks better questions:

- What happens to my savings if I buy now?
- Is waiting actually safer, or just slower?
- What does the cheaper option change?
- How much does an EMI really cost, including interest?
- Can my monthly cash flow carry another commitment?
- What happens if an unexpected expense lands while I’m paying for this?
- Which decision keeps my **emergency fund** intact?

Every projection is deterministic, rounded and explainable. No investment returns are assumed, and the emergency fund is never treated as spendable.

---

## Features

### Six working views

| View | What it does |
| --- | --- |
| **Overview** | Financial weather score, 12-month savings projection, cash-flow split, planned purchase, upcoming payments and recent activity. |
| **Parallel Futures** | Compare no purchase, buy now, wait & save, a lighter alternative, EMI and a buy + unexpected-expense path. Includes a recommendation, ending-vs-lowest bar comparison, scenario detail bars and a stress lab for salary delays and spending shocks. |
| **Purchase Planner** | Assess a purchase against the ring-fenced reserve, see readiness checks, a trajectory to the target date, a recommended saving pace and a saved-plan blueprint. |
| **EMI Calculator** | Calculate reducing-balance EMIs, total interest, processing fees, effective cost and affordability context. Download the schedule or save the result directly to the tracker. |
| **Installment Tracker** | Add, pay, delete and review installment plans. Payment reminders, overdue states, progress, monthly commitment and completed-plan history are included. |
| **Financial Profile** | Validated editing of income, expenses, debt, savings, reserve target and goals, with a live preview of the backend scoring model. Restore the demo profile from a confirmation dialog. |

### Product behaviour

- Midnight-navy and emerald visual system with an embedded Streamlit theme.
- Responsive layout from narrow phone widths through wide desktop screens.
- Real loading states, empty states, error states, flash confirmations and session-backed dialogs.
- All six views are registered through `st.navigation`. Overview is served at `/`; the other views use `/futures`, `/planner`, `/emi`, `/installments` and `/profile`.
- Every save, delete, payment and simulation is a real API call. No placeholder buttons.
- Charts are rendered with Altair from Python data frames and include adjacent text summaries.
- The emergency reserve is protected on every page and in every calculation.

### Financial model

- **Emergency reserve is ring-fenced:** safe-to-spend = `current savings − emergency fund target`. It cannot go below zero.
- **No investment return:** all paths use 0% assumed return. Differences come from timing, spending and interest.
- **Buy now:** the full purchase is deducted today, at month 0.
- **Wait & save:** monthly free cash flow accumulates first; the full purchase is paid in the selected future month.
- **Lighter alternative:** buys a cheaper version today.
- **EMI:** down payment today, then reducing-balance monthly installments. Total interest is exposed separately.
- **Curveball:** buy now plus a one-off unexpected expense in a chosen month.
- **Stress lab:** tests the buy-now path against an unexpected expense, delayed salary (eventually paid in full), higher spending, and all three combined.
- **Risk and scoring:** paths are scored on ending reserve, lowest reserve, average cash flow and interest cost. Risk labels are deterministic.
- **Affordability:** monthly free cash flow = income − essentials − discretionary spending − existing debt payments. Tracked installments are then compared against that free cash flow.

The purchase decision is illustrative, not financial advice.

---

## Quick start

### Prerequisites

- **Python 3.12+** (3.14 works in the current development environment)
- No Node.js, npm or browser build step is required.

### One command

```bash
./scripts/dev.sh
```

The script creates `backend/.venv` if needed, installs backend and Streamlit dependencies, then starts both servers:

- Streamlit interface: <http://localhost:8501>
- API docs: <http://localhost:8000/docs>

Press `Ctrl+C` once to stop both.

### Manual setup

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/pip install -r requirements-ui.txt

# Terminal 1 — API
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Terminal 2 — Streamlit
API_URL=http://127.0.0.1:8000/api/v1 \
  backend/.venv/bin/python -m streamlit run streamlit_app/app.py
```

The Streamlit app reads `API_URL` from the environment, falling back to an `API_URL` entry in the repository `.env`, then to `http://127.0.0.1:8000/api/v1`.

### First launch

On first startup the backend creates `data/financial_parallelverse.db` and seeds a fictional demo workspace:

- Aarav Mehta, ₹82,000 monthly income, ₹2,20,000 savings
- ₹1,80,000 emergency-fund target
- ₹70,000 laptop planned in three months
- Two active installment plans
- One saved purchase plan and one past simulation

Seeding is idempotent and never overwrites an existing profile.

### Reset the demo workspace

```bash
backend/.venv/bin/python scripts/seed_demo.py --reset
```

This deletes the local SQLite file and recreates the demo profile, installments, purchase plan and simulation. Use `--reset` only when you intentionally want to discard local data.

---

## Tests and checks

```bash
# Backend unit + API tests and Streamlit preview/formatting tests
backend/.venv/bin/pytest

# Python syntax check for the app and UI
backend/.venv/bin/python -m compileall -q backend/app streamlit_app

# Start the interface for a manual smoke test
backend/.venv/bin/python -m streamlit run streamlit_app/app.py
```

The suite covers affordability, the financial engine, scenario paths, stress tests, EMI amortization/affordability, installments, profile validation, purchases, health, Streamlit preview parity and currency formatting.

For an automated render check of the default view, run a Streamlit `AppTest` against `streamlit_app/app.py` while the API is running:

```bash
API_URL=http://127.0.0.1:8000/api/v1 backend/.venv/bin/python - <<'PY'
from streamlit.testing.v1 import AppTest
at = AppTest.from_file("streamlit_app/app.py", default_timeout=90)
at.run()
assert not at.exception
print("App rendered with", len(at.metric), "metrics")
PY
```

---

## Docker

```bash
docker compose up --build
```

- Streamlit interface: <http://localhost:8501>
- API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>

The Compose stack has two services:

- `backend` — FastAPI, SQLAlchemy and the SQLite database.
- `ui` — Streamlit, built from `Dockerfile.streamlit`, calling the API at `http://backend:8000/api/v1`.

Data is stored in the named volume `fpv-data`. Rebuild after changing dependencies:

```bash
docker compose up --build --force-recreate
```

To remove the containerised database as well:

```bash
docker compose down -v
```

This deletes the volume and all local app data.

---

## Configuration

Copy `.env.example` to `.env` at the repository root for local overrides.

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_URL` | `http://127.0.0.1:8000/api/v1` | FastAPI base URL used by Streamlit. |
| `DATABASE_URL` | `sqlite:///<repo>/data/financial_parallelverse.db` | SQLAlchemy database URL. |
| `CORS_ORIGINS` | `http://localhost:8501,http://127.0.0.1:8501` | Comma-separated browser origins, only needed for direct browser API clients. |
| `SEED_DEMO` | `true` | Seed demo data when no profile exists. |
| `API_PREFIX` | `/api/v1` | API route prefix. |
| `ENVIRONMENT` | `development` | Reported by the health endpoint. |

Do not commit `.env` files. The API has no authentication and is intended for local/demo use.

---

## API reference

All endpoints are prefixed with `/api/v1`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service and database health. |
| `GET` | `/profile` | Read the financial profile with derived metrics. |
| `PUT` | `/profile` | Validate and replace profile values. |
| `POST` | `/profile/demo` | Restore demo profile values without deleting other records. |
| `GET` | `/dashboard` | Overview snapshot, projection, upcoming payments and insight. |
| `POST` | `/scenarios/simulate` | Run the six-scenario comparison and persist the run. |
| `GET` | `/scenarios/recent` | Recent simulation runs. |
| `POST` | `/purchases/assess` | Assess a purchase amount and target date. |
| `GET` | `/purchases/plans` | List saved purchase plans. |
| `POST` | `/purchases/plans` | Save a plan and optionally align the profile. |
| `DELETE` | `/purchases/plans/{id}` | Remove a saved plan. |
| `POST` | `/emi/calculate` | Reducing-balance EMI calculation and affordability. |
| `GET` | `/installments` | Plans, summary and reminders. |
| `POST` | `/installments` | Create a tracked installment plan. |
| `PATCH` | `/installments/{id}/pay` | Mark the next payment paid and advance the due date. |
| `DELETE` | `/installments/{id}` | Delete a plan and its payment records. |
| `GET` | `/installments/reminders` | Actionable reminders only. |

OpenAPI documentation is available at `/docs` and `/redoc`. The API root (`/`) returns service information pointing at the Streamlit interface.

---

## Project structure

```text
financial-parallelverse/
├── streamlit_app/
│   ├── app.py                  # page config, navigation, sidebar shell
│   ├── api.py                  # HTTP client for the FastAPI service
│   ├── theme.py                # embedded midnight/emerald styling
│   ├── ui.py                   # formatting, badges, dialogs and shared UI
│   ├── charts.py               # Altair projection, futures, cashflow and EMI charts
│   ├── finance.py              # pure preview math mirrored from the backend
│   ├── views/                  # six product views
│   │   ├── overview.py
│   │   ├── futures.py
│   │   ├── planner.py
│   │   ├── emi.py
│   │   ├── installments.py
│   │   └── profile.py
│   └── tests/                  # Streamlit preview and formatting tests
├── backend/
│   ├── app/
│   │   ├── api/                # health, profile, dashboard, scenarios, purchases, EMI, installments
│   │   ├── services/           # affordability, scenario engine, EMI, purchase planner, seed, reminders
│   │   ├── config.py           # pydantic-settings configuration
│   │   ├── database.py         # SQLAlchemy engine/session
│   │   ├── models.py           # profile, installment, payment, simulation, purchase plan
│   │   ├── schemas.py          # typed API contracts
│   │   └── main.py             # FastAPI app, lifespan and routers
│   ├── tests/                  # pytest unit and API suite
│   ├── Dockerfile
│   └── requirements.txt
├── scripts/
│   ├── dev.sh                  # run FastAPI + Streamlit
│   └── seed_demo.py            # seed or reset the demo database
├── .streamlit/config.toml      # Streamlit theme and server defaults
├── requirements-ui.txt         # Streamlit, Altair, pandas and httpx
├── Dockerfile.streamlit        # interface image
├── docker-compose.yml
├── data/                       # SQLite database (ignored by git)
├── .env.example
├── AGENTS.md
└── README.md
```

---

## Design and engineering notes

- **One language, two processes.** Streamlit collects input and renders responses; FastAPI owns validation, scoring, persistence and all financial calculations.
- **Server is the source of truth.** `streamlit_app/finance.py` mirrors the profile preview for instant feedback, but saving always revalidates on the backend and then refreshes from the API.
- **Embedded styling, no asset pipeline.** The theme lives in a Python string in `streamlit_app/theme.py`; Streamlit's palette is configured in `.streamlit/config.toml`. There are no separate CSS, HTML or JavaScript source files.
- **Typed contracts.** Pydantic schemas define API responses. The Streamlit client consumes them centrally in `streamlit_app/api.py`.
- **One profile record.** This is a personal demo workspace rather than a multi-user SaaS app. Profile reset updates only profile fields, preserving plans, installments and simulations.
- **Deterministic by design.** Simulations are pure functions of profile, inputs and dates. No randomness or market data is involved.
- **Real states only.** Mutations call the API, show loading/error states, and refresh the relevant data. Dialogs persist their open state across Streamlit reruns.
- **No secrets in the repository.** SQLite, environment files, Streamlit secrets and build output are ignored. The demo data is fictional.

The earlier React/Vite interface remains available in the repository's Git history, but it is no longer part of the working tree or build.

### Known limitations

- Single local profile; no authentication or multi-user isolation.
- No investment return, inflation, tax or credit-score modelling.
- EMI and installment interest assumes a fixed annual rate and does not model lender-specific fees or changing rates.
- SQLite is appropriate for a local demo, not a concurrent production deployment.
- The app is educational and does not provide regulated financial advice.

---

## License and data

This is a demonstration project. All names, amounts and merchants are fictional. Use the code and patterns freely for learning and prototyping, and replace the demo data before adapting it to any real use.
