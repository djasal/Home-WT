from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

import config

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state will be injected here from main.py
app.state.parking_status = {}

@app.get("/api/parking/status")
def get_status():
    return app.state.parking_status

@app.get("/api/parking/snapshot/{camera_id}")
def get_snapshot(camera_id: str):
    path = f"{config.SNAPSHOT_DIR}/{camera_id}_latest.jpg"
    if not os.path.exists(path):
        # Fallback to test snapshot
        path = f"{config.SNAPSHOT_DIR}/{camera_id}_snapshot.jpg"
        if not os.path.exists(path):
            return {"error": "Snapshot not available"}
    return FileResponse(path)

@app.get("/api/parking/summary")
def get_summary():
    status_dict = app.state.parking_status
    total = len(status_dict)
    free = sum(1 for s in status_dict.values() if s["status"] == "FREE")
    occupied = total - free
    percent = (free / total * 100) if total > 0 else 0
    return {
        "total": total,
        "free": free,
        "occupied": occupied,
        "percent_free": round(percent, 1)
    }
