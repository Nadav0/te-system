from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routers import auth, users, expenses, travel, policy, analytics, notifications, search
from app.database import engine, Base
import app.models  # noqa: F401 — ensure all models are registered

app = FastAPI(title="T&E System API", version="1.0.0")

_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup (Alembic preferred in production)
Base.metadata.create_all(bind=engine)

# Serve uploaded receipts
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(travel.router)
app.include_router(policy.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(search.router)


@app.get("/health")
def health():
    return {"status": "ok"}
