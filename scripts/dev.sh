#!/usr/bin/env bash
# Run the FastAPI backend and the Streamlit interface together for local development.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
UI_PORT="${UI_PORT:-${FRONTEND_PORT:-8501}}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="$ROOT_DIR/backend/.venv"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python 3 is required but was not found. Set PYTHON_BIN to a Python executable." >&2
  exit 1
fi

if ! "$PYTHON_BIN" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 12) else 1)'; then
  echo "Python 3.12 or newer is required. Set PYTHON_BIN to a compatible executable." >&2
  exit 1
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  echo "Creating the Python virtual environment..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/backend/requirements.txt"
  "$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/requirements-ui.txt"
else
  # Keep existing local environments usable after the Python-only migration.
  if ! "$VENV_DIR/bin/python" -c "import fastapi" >/dev/null 2>&1; then
    echo "Installing backend dependencies..."
    "$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/backend/requirements.txt"
  fi
  if ! "$VENV_DIR/bin/python" - <<'PY' >/dev/null 2>&1
from importlib.metadata import version
from packaging.version import Version

assert Version(version("streamlit")) >= Version("1.66")
assert Version(version("altair")) >= Version("6.3")
assert Version(version("pandas")) >= Version("2.3")
PY
  then
    echo "Installing Streamlit interface dependencies..."
    "$VENV_DIR/bin/pip" install --quiet -r "$ROOT_DIR/requirements-ui.txt"
  fi
fi

export API_URL="${API_URL:-http://127.0.0.1:$BACKEND_PORT/api/v1}"

echo ""
echo "  Financial Parallelverse"
echo "  Interface  http://localhost:$UI_PORT"
echo "  API docs   http://localhost:$BACKEND_PORT/docs"
echo "  Press Ctrl+C to stop both servers."
echo ""

(
  cd "$ROOT_DIR/backend"
  export PYTHONUNBUFFERED=1
  exec "$VENV_DIR/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

(
  cd "$ROOT_DIR"
  export API_URL
  exec "$VENV_DIR/bin/python" -m streamlit run streamlit_app/app.py \
    --server.address 0.0.0.0 \
    --server.port "$UI_PORT" \
    --server.headless true \
    --browser.gatherUsageStats false
) &
UI_PID=$!

cleanup() {
  trap - EXIT INT TERM
  kill "$BACKEND_PID" "$UI_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$UI_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait -n "$BACKEND_PID" "$UI_PID"
