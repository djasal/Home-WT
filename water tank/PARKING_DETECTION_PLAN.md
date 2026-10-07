# 🅿️ Smart Parking Detection System — Full Plan

> **Goal:** Detect empty vs. occupied parking spaces in real-time using existing XVR cameras, and display results in a web dashboard.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        XVR / DVR Unit                           │
│   Camera 1 ──┐                                                  │
│   Camera 2 ──┼──► RTSP Streams (rtsp://ip/channel)             │
│   Camera 3 ──┘                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Local Network
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                  Detection Server (Python)                      │
│                                                                │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  OpenCV      │    │  YOLOv8         │    │  Zone Logic  │  │
│  │  RTSP Reader │───►│  Car Detector   │───►│  Per Space   │  │
│  └──────────────┘    └─────────────────┘    └──────┬───────┘  │
│                                                     │          │
│  ┌──────────────────────────────────────────────────▼───────┐  │
│  │              FastAPI Server                              │  │
│  │  GET /status         → live space statuses              │  │
│  │  GET /snapshot/:cam  → annotated JPEG frame             │  │
│  │  WebSocket /ws/live  → real-time push updates           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│              Web Dashboard (React – Your Existing App)         │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Live Camera │  │  Space Grid  │  │  Stats & History     │ │
│  │  Snapshot    │  │  (Free/Used) │  │  (Occupancy %)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ What You Need to Prepare (Before Starting)

### 1. XVR/Camera Access
- [ ] Know your XVR's **local IP address** (e.g. `192.168.1.100`)
- [ ] Know the **RTSP username and password**
- [ ] Test the RTSP URL format for your brand:
  - **Hikvision:** `rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101`
  - **Dahua:** `rtsp://admin:pass@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0`
  - **Generic:** Check XVR settings → Network → RTSP
- [ ] Confirm you can open the stream in **VLC** (`Media → Open Network Stream`)

### 2. Server Machine
- [ ] Windows or Linux PC on the **same local network** as the XVR
- [ ] At least **8 GB RAM**
- [ ] GPU (NVIDIA) preferred — CPU-only is OK for 2-3 cameras at 5 FPS
- [ ] Python **3.10 or 3.11** installed
- [ ] Internet access to download models once

### 3. Camera Positioning Info
- [ ] Know how many **total parking spaces** are visible across all cameras
- [ ] Know which camera covers which spaces (for labeling)
- [ ] Ideally cameras are **top-down or angled** (not ground level) for best detection

---

## 📦 Software Stack

| Layer | Technology | Purpose |
|---|---|---|
| Video input | OpenCV (`cv2`) | Pull RTSP stream frames |
| AI Detection | YOLOv8 (`ultralytics`) | Detect cars in frames |
| Zone logic | Shapely / NumPy | Check if car overlaps parking zone |
| Zone editor | Custom HTML canvas tool | Draw parking space polygons on camera image |
| API | FastAPI + Uvicorn | Serve status to frontend |
| Real-time push | WebSocket | Push live updates to browser |
| Database | SQLite (or PostgreSQL) | Store occupancy history |
| Frontend | React (your existing app) | Show dashboard page |

---

## 📁 Project Structure

```
parking-detector/
├── detector/
│   ├── main.py              # Entry point — starts all camera threads
│   ├── camera.py            # RTSP reader + YOLO inference per camera
│   ├── zone_checker.py      # Polygon overlap logic
│   ├── zones.json           # Defined parking space polygons (per camera)
│   └── models/              # YOLOv8 weights (auto-downloaded)
│
├── api/
│   ├── server.py            # FastAPI routes
│   ├── websocket.py         # WebSocket broadcast
│   └── db.py                # SQLite history logging
│
├── zone-editor/
│   └── index.html           # Standalone HTML tool to draw zones on camera snapshot
│
└── requirements.txt
```

---

## 🔢 Implementation Phases

### Phase 0 — Setup & Validation (Day 1)
> Goal: Confirm RTSP works and YOLO can detect cars

1. Install Python dependencies
2. Connect to RTSP stream with OpenCV
3. Run YOLOv8 on a single frame
4. Confirm cars are detected correctly
5. Take a snapshot from each camera

### Phase 1 — Zone Editor (Day 1-2)
> Goal: Draw parking space polygons on camera images

1. Build a simple HTML canvas tool
2. Load the camera snapshot as background
3. Click to draw polygon corners for each space
4. Assign a label to each space (e.g. `CAM1-A1`, `CAM1-A2`)
5. Export polygons to `zones.json`

**zones.json format:**
```json
{
  "camera_1": [
    { "id": "A1", "polygon": [[100,200],[200,200],[200,300],[100,300]] },
    { "id": "A2", "polygon": [[210,200],[310,200],[310,300],[210,300]] }
  ],
  "camera_2": []
}
```

### Phase 2 — Detection Engine (Day 2-3)
> Goal: Run inference per camera, check zones, emit status

1. For each camera thread:
   - Read frame from RTSP every N seconds (configurable, e.g. every 3s)
   - Run YOLOv8 to get all `car` / `truck` bounding boxes
   - For each parking zone polygon: check if any detected car overlaps it
   - Mark space as `OCCUPIED` or `FREE`
2. Store result in shared in-memory state dict
3. Log changes to SQLite with timestamp

### Phase 3 — FastAPI Server (Day 3)
> Goal: Expose status to the web dashboard

**Endpoints:**
```
GET  /api/parking/status        → all spaces (id, camera, status, lastUpdated)
GET  /api/parking/snapshot/:cam → latest annotated JPEG from that camera
GET  /api/parking/history       → occupancy over time (for charts)
WS   /ws/parking                → live push on every status change
```

### Phase 4 — Web Dashboard Page (Day 4-5)
> Goal: Add a "Parking" page to your existing React app

**UI Components:**
1. **Summary Bar** — `Free: 8 / Total: 12` with percentage badge
2. **Camera Snapshot View** — Live annotated image (refreshes every 5s)
3. **Space Grid** — Each space shown as a colored tile:
   - Green = Free
   - Red = Occupied
   - Grey = Unknown/Offline
4. **Occupancy History Chart** — Line chart showing % occupied over the day
5. **Camera Selector** — Switch between Camera 1, 2, 3

### Phase 5 — Polish & Reliability (Day 5-6)
1. Auto-reconnect if RTSP stream drops
2. Alert if a camera goes offline
3. Configurable detection sensitivity per zone
4. Docker containerization for easy deployment

---

## Configuration File (config.py)

```python
CAMERAS = [
    {
        "id": "camera_1",
        "name": "Parking North",
        "rtsp_url": "rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101",
        "fps_sample": 3,        # Check every 3 seconds
        "confidence": 0.45      # YOLO confidence threshold
    },
    {
        "id": "camera_2",
        "name": "Parking South",
        "rtsp_url": "rtsp://admin:password@192.168.1.100:554/Streaming/Channels/201",
        "fps_sample": 3,
        "confidence": 0.45
    }
]

YOLO_MODEL = "yolov8n.pt"   # nano = fastest, yolov8s.pt = more accurate
API_PORT = 8001
```

---

## Decision Points (Answer Before Starting)

| Question | Why It Matters |
|---|---|
| What is your XVR brand/model? | Determines RTSP URL format |
| Do you have a GPU on the server? | Affects model choice (nano vs. medium) |
| How many total parking spaces? | Affects zone editor workload |
| Is the server Windows or Linux? | Affects install commands |
| Should history be stored? | Affects database setup |
| Should it alert when full? | Adds notification feature scope |

---

## Python Requirements (requirements.txt)

```
ultralytics>=8.0.0
opencv-python>=4.8.0
fastapi>=0.110.0
uvicorn>=0.27.0
websockets>=12.0
shapely>=2.0.0
numpy>=1.24.0
pillow>=10.0.0
aiosqlite>=0.19.0
```

---

## Success Criteria

- [ ] RTSP stream connects successfully from all cameras
- [ ] YOLOv8 detects cars with > 85% accuracy in test snapshots
- [ ] All parking spaces have drawn zone polygons
- [ ] API returns correct free/occupied status
- [ ] Web dashboard updates in real-time
- [ ] System recovers automatically from camera disconnects

---

*Plan created: 2026-10-04 | Status: Awaiting approval to start implementation*
