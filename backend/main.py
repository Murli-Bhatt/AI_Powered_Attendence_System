import sys
import os

# Ensure root workspace directory is in sys.path when running python backend/main.py directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import teacher, student, attendance
import uvicorn

app = FastAPI(
    title="SnapClass AI Biometric Attendance System",
    description="Decoupled FastAPI backend for Facial Recognition and Voice Verification Attendance System",
    version="2.0.0"
)

# Enable CORS for local React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router Modules
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(attendance.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SnapClass AI Biometric Backend",
        "docs": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8001, reload=True)
