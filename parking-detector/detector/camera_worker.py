import cv2
import time
import json
import os
from ultralytics import YOLO

import config
from detector.zone_checker import ZoneChecker

CAR_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}

def run_camera(cam_config, shared_state, alert_engine):
    """
    Runs in its own thread or process.
    cam_config: dict from config.CAMERAS
    shared_state: thread-safe dict to store current space statuses
    alert_engine: instance of AlertEngine
    """
    print(f"[{cam_config['name']}] Starting worker...")
    
    # Load zones for this camera
    zones_data = []
    if os.path.exists(config.ZONES_FILE):
        with open(config.ZONES_FILE, "r") as f:
            all_zones = json.load(f)
            zones_data = all_zones.get(cam_config["id"], [])
            
    if not zones_data:
        print(f"[{cam_config['name']}] WARNING: No zones defined in {config.ZONES_FILE}")
        
    zone_checker = ZoneChecker(zones_data)
    
    # Init space statuses to FREE if they exist
    for z in zones_data:
        if z["id"] not in shared_state:
            shared_state[z["id"]] = {"status": "FREE", "camera": cam_config["name"], "last_update": time.time()}
            
    # Load YOLO
    model = YOLO(config.YOLO_MODEL)
    
    # Open RTSP
    cap = cv2.VideoCapture(cam_config["rtsp_url"], cv2.CAP_FFMPEG)
    
    last_process_time = 0
    interval = cam_config["sample_interval_sec"]
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print(f"[{cam_config['name']}] Stream disconnected. Reconnecting in 5s...")
            cap.release()
            time.sleep(5)
            cap = cv2.VideoCapture(cam_config["rtsp_url"], cv2.CAP_FFMPEG)
            continue
            
        now = time.time()
        if now - last_process_time >= interval:
            last_process_time = now
            
            # Detect cars
            results = model(frame, conf=cam_config["confidence_threshold"], device=config.YOLO_DEVICE, verbose=False)[0]
            
            car_boxes = []
            for box in results.boxes:
                if int(box.cls[0]) in CAR_CLASSES:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    car_boxes.append((x1, y1, x2, y2))
                    
            # Check zones
            occupied_ids = zone_checker.get_occupancy(car_boxes, config.OVERLAP_THRESHOLD)
            
            # Update state & check alerts
            for z in zones_data:
                sid = z["id"]
                is_occupied = sid in occupied_ids
                new_status = "OCCUPIED" if is_occupied else "FREE"
                
                prev_status = shared_state[sid]["status"]
                
                if new_status != prev_status:
                    # Status changed
                    shared_state[sid]["status"] = new_status
                    shared_state[sid]["last_update"] = now
                    
                    if new_status == "FREE" and config.ALERT_ON_FREE:
                        alert_engine.notify_free(sid, cam_config["name"])
            
            # Save annotated snapshot
            for z in zones_data:
                # Draw zone
                pts = z["polygon"]
                for i in range(len(pts)):
                    p1 = tuple(pts[i])
                    p2 = tuple(pts[(i+1)%len(pts)])
                    color = (0,0,255) if z["id"] in occupied_ids else (0,255,0) # BGR: Red if occupied, Green if free
                    cv2.line(frame, p1, p2, color, 2)
                    
            for (x1, y1, x2, y2) in car_boxes:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2) # Blue for cars
                
            out_path = f"{config.SNAPSHOT_DIR}/{cam_config['id']}_latest.jpg"
            cv2.imwrite(out_path, frame)
