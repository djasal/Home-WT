import threading
import uvicorn
import time
import sys

import config
from detector.camera_worker import run_camera
from detector.alert_engine import AlertEngine
from api.server import app

def start():
    print("==================================================")
    print(" Parking Detection System starting...")
    print("==================================================")
    
    # Thread-safe dictionary for state
    shared_state = {}
    
    alert_engine = AlertEngine()
    
    app.state.parking_status = shared_state
    
    threads = []
    
    # Start a thread for each camera
    for cam in config.CAMERAS:
        t = threading.Thread(target=run_camera, args=(cam, shared_state, alert_engine), daemon=True)
        t.start()
        threads.append(t)
        
    print(f"Started {len(config.CAMERAS)} camera workers.")
    print(f"Starting API Server on http://{config.API_HOST}:{config.API_PORT}")
    
    # Start FastAPI (blocking)
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT, log_level="error")

if __name__ == "__main__":
    start()
