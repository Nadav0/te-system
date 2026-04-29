#!/usr/bin/env bash
# ──────────────────────────────────────────────
# T&E System — Local dev startup
# Database: SQLite (no external DB needed)
# Python:   /opt/homebrew/bin/python3.12
# Node:     system node (22.x)
# ──────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
PYTHON=/opt/homebrew/bin/python3.12

echo "=== T&E System — Dev Startup ==="

# ── Backend ──────────────────────────────────
echo ""
echo "→ Setting up Python backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  "$PYTHON" -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
  echo "  dependencies installed"
fi

echo "  seeding database..."
.venv/bin/python -m app.seed

echo "  starting FastAPI on http://localhost:8000"
.venv/bin/uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────
echo ""
echo "→ Starting React frontend on http://localhost:5173"
cd "$ROOT/frontend"
npm install -q
npm run dev -- --port 5173 &
FRONTEND_PID=$!

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  T&E System running!                    │"
echo "│  Frontend: http://localhost:5173        │"
echo "│  Backend:  http://localhost:8000        │"
echo "│  API docs: http://localhost:8000/docs   │"
echo "│                                         │"
echo "│  Demo logins (password: password):      │"
echo "│  employee@company.com — Employee        │"
echo "│  manager@company.com  — Manager         │"
echo "│  finance@company.com  — Finance/Admin   │"
echo "│                                         │"
echo "│  Press Ctrl+C to stop                  │"
echo "└─────────────────────────────────────────┘"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
