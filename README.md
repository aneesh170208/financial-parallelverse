# Financial Parallelverse

A local-first fintech workspace for exploring the **financial consequences of a purchase** before making it. Compare six possible futures, protect an emergency reserve, plan a purchase, understand EMI costs, and track existing installments — all in one deterministic, explainable demo app.

Built with **React + TypeScript + Vite + Tailwind CSS + Recharts** on the frontend and **FastAPI + SQLAlchemy + SQLite** on the backend.

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

### Six working pages

| Page | What it does |
| --- | --- |
| **Overview** | Financial weather score, 12-month savings projection, cash-flow split, planned purchase, upcoming payments and recent activity. |
| **Parallel Futures** | Compare no purchase, buy now, wait & save, a lighter alternative, EMI and a buy + unexpected-expense path. Includes a recommendation, comparison chart, scenario details and a stress lab for salary delays and spending shocks. |
| **Purchase Planner** | Assess a purchase against the ring-fenced reserve, see readiness checks, a trajectory to the target date, a recommended saving pace and a saved-plan blueprint. |
| **EMI Calculator** | Calculate reducing-balance EMIs, total interest, processing fees, effective cost and affordability context. Save the result directly to the tracker. |
| **Installment Tracker** | Add, pay, delete and review installment plans. Payment reminders, overdue states, progress, monthly commitment and completed-plan history are included. |
| **Financial Profile** | Validated editing of income, expenses, debt, savings, reserve target and goals, with a live preview of the backend scoring model. Restore the demo profile from a confirmation dialog. |

### Product behaviour

- Premium midnight-navy and emerald visual system, responsive from 320 px upward.
- Real loading skeletons, empty states, error states, toast confirmations and accessible dialogs.
- Mobile bottom navigation and slide-out drawer; collapsible desktop sidebar.
- All navigation items resolve to working routes. Unknown routes get a designed 404 page.
- Every save, delete, payment and simulation is a real API call. No placeholder buttons.
- A runtime error boundary converts unexpected interface failures into a recoverable screen.
- A 404 fallback is served by the backend for client-side routes when the production build exists.

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

- **Node.js 20.19+ or 22.12+** (Node 22 LTS recommended)
- **Python 3.12+**
- npm

### One command

```bash
./scripts/dev.sh
```

The script creates `backend/.venv`, installs backend requirements and frontend packages if needed, then starts both servers:

- Frontend: <http://localhost:5173>
- API docs: <http://localhost:8000/docs>

Press `Ctrl+C` once to stop both.

### Manual setup

**Backend**

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000` by default. Override with `VITE_API_PROXY_TARGET` if your API runs elsewhere.

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
# Backend unit + API tests
backend/.venv/bin/pytest

# Frontend component and model tests
cd frontend
npm test

# TypeScript production build
npm run build

# Static lint checks
npm run lint
```

The backend suite covers affordability, the financial engine, scenario paths, stress tests, EMI amortization/affordability, installments, profile validation, purchases and health. Frontend tests cover the deterministic profile preview and the add-installment form validation/payload.

---

## Production build

```bash
cd frontend
npm run build
cd ..
backend/.venv/bin/uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

When `frontend/dist` exists, FastAPI serves the built SPA from `/` and falls back to `index.html` for client-side routes. API routes remain under `/api/v1`. The built site is then available at <http://localhost:8000>.

Alternatively, serve `frontend/dist` with any static host and point `VITE_API_URL` at the API. The included Docker setup uses nginx with an SPA fallback and an `/api` proxy.

---

## Docker

```bash
docker compose up --build
```

- App: <http://localhost:5173>
- API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>

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

Copy `.env.example` to `.env` at the repository root for backend overrides. Copy `frontend/.env.example` to `frontend/.env` for frontend overrides.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///<repo>/data/financial_parallelverse.db` | SQLAlchemy database URL. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins. |
| `SEED_DEMO` | `true` | Seed demo data when no profile exists. |
| `API_PREFIX` | `/api/v1` | API route prefix. |
| `ENVIRONMENT` | `development` | Reported by the health endpoint. |
| `VITE_API_URL` | `/api/v1` | API base used by the browser. |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8000` | Vite dev proxy target. |

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

OpenAPI documentation is available at `/docs` and `/redoc`.

---

## Project structure

```text
financial-parallelverse/
├── backend/
│   ├── app/
│   │   ├── api/                 # health, profile, dashboard, scenarios, purchases, EMI, installments
│   │   ├── services/            # affordability, scenario engine, EMI, purchase planner, seed, reminders
│   │   ├── config.py            # pydantic-settings configuration
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── models.py            # profile, installment, payment, simulation, purchase plan
│   │   ├── schemas.py           # typed API contracts
│   │   └── main.py              # FastAPI app, lifespan, routers, SPA serving
│   ├── tests/                   # pytest unit and API suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # dashboard, simulator, purchases, EMI, installments, layout, UI
│   │   ├── lib/                 # typed API client, app context, math and formatting helpers
│   │   ├── pages/               # six product pages + 404
│   │   ├── test/                # Vitest setup
│   │   ├── App.tsx              # providers, routes, toaster, error boundary
│   │   └── index.css            # design tokens and global styles
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── scripts/
│   ├── dev.sh                   # run both servers
│   └── seed_demo.py             # seed or reset the demo database
├── data/                        # SQLite database (ignored by git)
├── docker-compose.yml
├── .env.example
├── AGENTS.md
└── README.md
```

---

## Design and engineering notes

- **Typed contracts end to end.** Pydantic schemas define the API shape; `frontend/src/types/api.ts` mirrors it; the API client is centralised in `frontend/src/lib/api.ts`.
- **Server is the source of truth.** The profile page preview replicates the affordability model for instant feedback, but saving always revalidates on the backend and then refreshes the dashboard.
- **One profile record.** This is a personal demo workspace rather than a multi-user SaaS app. Profile reset updates only profile fields, preserving plans, installments and simulations.
- **Deterministic by design.** Simulations are pure functions of profile, inputs and dates. No randomness or market data is involved.
- **Accessible interactions.** Dialogs use Radix primitives with titles/descriptions, forms use labels and inline errors, charts have text alternatives, progress bars are labelled, and reduced-motion preferences are respected.
- **No secrets in the repository.** SQLite, environment files and build output are ignored. The demo data is fictional.

### Known limitations

- Single local profile; no authentication or multi-user isolation.
- No investment return, inflation, tax or credit-score modelling.
- EMI and installment interest assumes a fixed annual rate and does not model lender-specific fees or changing rates.
- SQLite is appropriate for a local demo, not a concurrent production deployment.
- The app is educational and does not provide regulated financial advice.

---

## License and data

This is a demonstration project. All names, amounts and merchants are fictional. Use the code and patterns freely for learning and prototyping, and replace the demo data before adapting it to any real use.
