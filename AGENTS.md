# AGENTS.md

Guidance for AI agents and contributors working in **Financial Parallelverse**.

## What this project is

A local-first fintech demo that compares the financial consequences of a purchase. It has six Streamlit views (Overview, Parallel Futures, Purchase Planner, EMI Calculator, Installment Tracker, Financial Profile) backed by a FastAPI API and a SQLite database.

The product is deterministic and explainable. It is **not** financial advice. Do not introduce market data, random projections, authentication, or multi-user assumptions without an explicit request.

## Stack

| Layer | Technology |
| --- | --- |
| Interface | Streamlit, Altair, pandas |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2 (sync), Pydantic 2, SQLite |
| HTTP client | httpx |
| Interface tests | Pytest, Streamlit preview/formatting tests, `streamlit.testing.v1.AppTest` for render checks |
| Backend tests | Pytest, FastAPI TestClient, httpx |
| Formatting | Python throughout; no JS/TS/CSS source files or Node build |

## Repository layout

```text
streamlit_app/
  app.py          # page config, navigation, sidebar shell
  api.py          # HTTP client for the FastAPI service
  theme.py        # embedded styling and sidebar brand
  ui.py           # formatting, badges, flash messages, shared UI helpers
  charts.py       # Altair charts
  finance.py      # pure profile-preview math (mirrors the backend)
  views/          # six product views
  tests/          # preview and formatting tests
backend/app/
  api/            # thin routers: health, profile, dashboard, scenarios, purchases, emi, installments
  services/       # financial engine, affordability, scenario engine, EMI, purchases, reminders, seed
  config.py       # pydantic-settings; reads root .env
  database.py     # engine, SessionLocal, get_db, init_db
  models.py       # profile, installments, payments, simulations, purchase plans
  schemas.py      # API contracts and validation
  main.py         # app, routers, root information endpoint
backend/tests/    # pytest suite
scripts/
  dev.sh          # create venv/install deps and run both servers
  seed_demo.py    # seed or reset the local database
```

## Commands

Run from the repository root unless noted.

```bash
# One-command development (FastAPI :8000, Streamlit :8501)
./scripts/dev.sh

# Tests (backend + Streamlit preview/formatting)
backend/.venv/bin/pytest

# API
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000

# Streamlit
API_URL=http://127.0.0.1:8000/api/v1 \
  backend/.venv/bin/python -m streamlit run streamlit_app/app.py

# Syntax check
backend/.venv/bin/python -m compileall -q backend/app streamlit_app

# Reset and reseed the demo workspace (destructive: deletes local DB)
backend/.venv/bin/python scripts/seed_demo.py --reset
```

If `backend/.venv` does not exist, create it first:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/pip install -r requirements-ui.txt
```

The app runs without environment variables. Copy `.env.example` to `.env` only when overriding defaults. `API_URL` is read by Streamlit; the backend reads `DATABASE_URL`, `CORS_ORIGINS`, `SEED_DEMO`, `API_PREFIX` and `ENVIRONMENT`.

## Architecture invariants

- **The API is the source of truth.** `streamlit_app/finance.py` mirrors the profile preview only for instant feedback; saves must be validated by the backend and followed by a data refresh.
- **Emergency fund is ring-fenced.** Safe-to-spend is `current_savings - emergency_fund_target`, floored at zero. Never treat the reserve as spendable, and never let a projection imply it can be used for discretionary spending.
- **Deterministic projections.** No random values or investment returns. Use the existing scenario engine rather than duplicating formulas in view modules.
- **Buy-now timing.** The buy-now outflow is deducted at month 0. Wait-and-save accumulates free cash flow and pays in the selected month. Keep these semantics consistent across the scenario engine, stress lab and charts.
- **One profile record.** `GET/PUT /profile` operate on a single row. Profile reset (`POST /profile/demo`) restores profile fields only; it must not delete installments, plans or simulations.
- **Typed contracts.** Any API shape change requires updating `backend/app/schemas.py` and the Streamlit consumer in `streamlit_app/api.py`, plus every view that reads the changed fields.
- **Real states only.** No fake buttons or placeholder actions. Every mutation calls the API and surfaces loading, empty, error and success states.
- **No secrets.** Keep `.env`, `.streamlit/secrets.toml`, SQLite files and virtual environments out of version control. Demo data must stay fictional.

## API conventions

- All routes live under `/api/v1`.
- Errors use FastAPI's `{"detail": "..."}` shape. `streamlit_app/api.py` translates them into user-facing messages and raises `ApiError`.
- Financial responses use INR and round to whole rupees at the boundary.
- Shared backend logic belongs in `backend/app/services/`; routers stay thin.
- SQLAlchemy sessions are request-scoped via `get_db`.

## Streamlit conventions

- Use `st.navigation` and `st.Page` in `app.py`; keep the six view modules in `streamlit_app/views/` as named `render()` functions.
- Use root-qualified imports, e.g. `from streamlit_app import api, ui`. The entrypoint adds the repository root to `sys.path` for direct launches.
- Reuse `streamlit_app.ui` for money/date formatting, badges, flash messages and shared layout. Do not add per-view formatting copies.
- Reuse `streamlit_app.charts` for Altair charts; set `theme=None` in `ui`/chart rendering so the embedded palette remains consistent.
- Styling lives in `streamlit_app/theme.py` as an embedded Python string and in `.streamlit/config.toml`. Do not add separate CSS, HTML or JavaScript files.
- Keep money inputs constrained with sensible `min_value`, `step` and `format` values, and validate cross-field rules before calling the API.
- Dialogs must survive Streamlit reruns. Store an explicit `*_show_*` flag in `st.session_state`, call the dialog on every run while the flag is true, and clear the flag in the dialog's `on_dismiss` callback and after success. Do not call a dialog only from inside the button's `if` block.
- Streamlit drops a page's widget keys when that page is not rendered. Keep cross-page results in ordinary session keys, and reinitialize keyed forms when their widget keys are missing.
- Charts need a text alternative or adjacent summary; they should not be the only way to understand data.
- Keep the app usable at narrow widths. Streamlit stacks columns automatically, but test long labels and metric rows.
- Use `st.form_submit_button(..., width="stretch")` where a full-width action is intended; avoid deprecated `use_container_width` in new code.

## Testing and verification

Before considering a change complete, run:

```bash
backend/.venv/bin/pytest
backend/.venv/bin/python -m compileall -q backend/app streamlit_app
```

- Backend tests use `pytest.ini` with `pythonpath=backend .` and add service-level tests for financial logic and API-level tests for persistence or validation changes.
- `streamlit_app/tests/test_finance.py` verifies that `derive_preview()` matches `backend/app/services/affordability.py` and covers formatting edge cases. Add a parity test whenever either formula changes.
- For render checks, start FastAPI and use `streamlit.testing.v1.AppTest`; see the README snippet. Do not make the default pytest suite depend on a live API.
- `streamlit_app/api.py` is the only place that constructs HTTP requests. Keep endpoint paths and payload serialization there.

## Manual smoke test

1. Start both servers with `./scripts/dev.sh`.
2. Visit every Streamlit view: `/` (Overview), `/futures`, `/planner`, `/emi`, `/installments`, `/profile`.
3. Save the profile, reload and confirm persistence.
4. Run a simulation and a purchase assessment.
5. Save a purchase plan, then delete it.
6. Calculate an EMI, download the schedule, and save it to the tracker.
7. Add an installment, mark a payment paid and delete the plan.
8. Confirm loading, empty and error states where reachable.
9. Reset the database with `seed_demo.py --reset` only after you are done testing.

## Data and safety

- Local database: `data/financial_parallelverse.db` (ignored by git).
- `scripts/seed_demo.py --reset` deletes that file and reseeds. Never run it against a database you do not intend to discard; it refuses non-SQLite URLs.
- Do not commit generated artifacts (`.venv`, `__pycache__`, SQLite files, `.env`, `.streamlit/secrets.toml`).
- Do not rewrite git history, force-push or delete user data without explicit confirmation.

## Style

- Python: standard library typing, `from __future__ import annotations` where useful, small service functions, no business logic in routers.
- Keep the midnight-navy/emerald visual system and Manrope/JetBrains Mono typography rather than introducing new palettes or fonts.
- Prefer readable, deterministic code over clever compression. Financial behavior should be explainable in one pass.
