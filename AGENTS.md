# AGENTS.md

Guidance for AI agents and contributors working in **Financial Parallelverse**.

## What this project is

A local-first fintech demo that compares the financial consequences of a purchase. It has six product pages (Overview, Parallel Futures, Purchase Planner, EMI Calculator, Installment Tracker, Financial Profile) backed by a FastAPI API and a SQLite database.

The product is deterministic and explainable. It is **not** financial advice. Do not introduce market data, random projections, authentication, or multi-user assumptions without an explicit request.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 (Node 20.19+ or 22.12+), Tailwind CSS 3, Recharts, Radix UI, Motion, Sonner |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2 (sync), Pydantic 2, SQLite |
| Frontend tests | Vitest, Testing Library, jsdom |
| Backend tests | Pytest, FastAPI TestClient, httpx |
| Lint | oxlint |

## Repository layout

```text
backend/app/
  api/          # thin routers: health, profile, dashboard, scenarios, purchases, emi, installments
  services/     # financial engine, affordability, scenario engine, EMI, purchases, reminders, seed
  config.py     # pydantic-settings; reads root .env
  database.py   # engine, SessionLocal, get_db, init_db
  models.py     # profile, installments, payments, simulations, purchase plans
  schemas.py    # API contracts and validation
  main.py       # app, routers, SPA serving
backend/tests/  # pytest suite
frontend/src/
  pages/        # six product pages + NotFound
  components/   # feature components + layout + shadcn-style ui primitives
  lib/          # api client, app context, profile math, formatting
  types/        # mirrors backend schemas
  test/         # Vitest setup
scripts/
  dev.sh        # create venv/install deps and run both servers
  seed_demo.py  # seed or reset the local database
```

## Commands

Run from the repository root unless noted.

```bash
# One-command development (backend :8000, frontend :5173)
./scripts/dev.sh

# Backend
backend/.venv/bin/pytest
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Frontend
cd frontend
npm test
npm run build
npm run lint
npm run dev -- --host 0.0.0.0

# Reset and reseed the demo workspace (destructive: deletes local DB)
backend/.venv/bin/python scripts/seed_demo.py --reset
```

If `backend/.venv` does not exist, create it first:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

The app runs without environment variables. Copy `.env.example` to `.env` or `frontend/.env.example` to `frontend/.env` only when overriding defaults.

## Architecture invariants

- **The API is the source of truth.** Frontend math in `frontend/src/lib/profile-math.ts` exists only for instant preview; saves must be validated by the backend and followed by a data refresh.
- **Emergency fund is ring-fenced.** Safe-to-spend is `current_savings - emergency_fund_target`, floored at zero. Never treat the reserve as spendable, and never let a projection imply it can be used for discretionary spending.
- **Deterministic projections.** No random values or investment returns. Use the existing scenario engine rather than duplicating formulas in components.
- **Buy-now timing.** The buy-now outflow is deducted at month 0. Wait-and-save accumulates free cash flow and pays in the selected month. Keep these semantics consistent across the scenario engine, stress lab and charts.
- **One profile record.** `GET/PUT /profile` operate on a single row. Profile reset (`POST /profile/demo`) restores profile fields only; it must not delete installments, plans or simulations.
- **Typed contracts end to end.** Any API shape change requires updating `backend/app/schemas.py` and `frontend/src/types/api.ts`, plus the client in `frontend/src/lib/api.ts`.
- **Real states only.** No fake buttons or placeholder actions. Every mutation calls the API and surfaces loading, empty, error and success states.
- **No secrets.** Keep `.env`, SQLite files and build output out of version control. Demo data must stay fictional.

## API conventions

- All routes live under `/api/v1`.
- Errors use FastAPI's `{"detail": "..."}` shape. The frontend API client translates these into user-facing messages.
- Financial responses use INR and round to whole rupees at the boundary.
- Shared backend logic belongs in `backend/app/services/`; routers stay thin.
- SQLAlchemy sessions are request-scoped via `get_db`.

## Frontend conventions

- Use the `@/` alias, not long relative paths.
- Reuse the existing design tokens, `cn()` helper, UI primitives and formatting utilities in `frontend/src/lib/format.ts`.
- Money inputs use `step="any"` intentionally so native validation never silently blocks valid values. Do not reintroduce coarse steps without testing form submission.
- Use Sonner toasts for mutation feedback and Radix dialogs for confirmations. Keep dialogs titled, described and keyboard accessible.
- Charts need a text alternative or adjacent summary; they should not be the only way to understand data.
- Respect `MotionConfig reducedMotion="user"`; do not add unconditional large animations.
- Keep the app usable at 320 px wide; test both the desktop sidebar and mobile bottom navigation.

## Testing and verification

Before considering a change complete, run:

```bash
backend/.venv/bin/pytest
cd frontend && npm test && npm run build && npm run lint
```

- Backend tests use `pytest.ini` with `pythonpath=backend`. Add service-level tests for financial logic and API-level tests for persistence or validation changes.
- Frontend tests use `src/test/setup.ts` with explicit RTL cleanup. Test validation rules and payloads, not implementation details.
- `npm run build` runs `tsc -b`; type errors fail the build. Keep `frontend/dist` out of commits.
- Product routes are lazy-loaded so the shell and API client stay in the initial bundle. Keep new heavy pages lazy and avoid importing page modules eagerly.

## Manual smoke test

1. Start both servers.
2. Visit all routes: `/`, `/futures`, `/planner`, `/emi`, `/installments`, `/profile`.
3. Save the profile, reload and confirm persistence.
4. Run a simulation and a purchase assessment.
5. Save a purchase plan, then delete it.
6. Calculate an EMI and save it to the tracker.
7. Add an installment, mark a payment paid and delete the plan.
8. Confirm loading, empty and error states where reachable.
9. Reset the database with `seed_demo.py --reset` only after you are done testing.

## Data and safety

- Local database: `data/financial_parallelverse.db` (ignored by git).
- `scripts/seed_demo.py --reset` deletes that file and reseeds. Never run it against a database you do not intend to discard; it refuses non-SQLite URLs.
- Do not commit generated artifacts (`node_modules`, `dist`, `.venv`, `__pycache__`, SQLite files, `.env`).
- Do not rewrite git history, force-push or delete user data without explicit confirmation.

## Style

- Python: standard library typing, `from __future__ import annotations` where useful, small service functions, no business logic in routers.
- TypeScript: strict typing, functional components, named exports for components, no `any` unless unavoidable.
- Follow the existing midnight-navy/emerald visual system and Manrope/JetBrains Mono typography rather than introducing new palettes or fonts.
