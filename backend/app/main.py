from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models

from .routers import (
    auth,
    employees,
    leave,
    work_reports,
    projects,
    notifications,
    attendance,
    profile,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="HRMS - Human Resource Management System",
    version="1.0.0",
    description="Human Resource Management System API",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(leave.router, prefix="/api")
app.include_router(work_reports.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(profile.router, prefix="/api")


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "HRMS API is running",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }