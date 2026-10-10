# Parking Detector - Configuration
import os

DAHUA_IP       = "192.168.1.108"
DAHUA_USER     = "admin"
DAHUA_PASSWORD = "admin1234"

def rtsp(channel: int) -> str:
    return (
        f"rtsp://{DAHUA_USER}:{DAHUA_PASSWORD}"
        f"@{DAHUA_IP}:554/cam/realmonitor"
        f"?channel={channel}&subtype=1"
    )

# Cameras 2, 3, 4 (camera 1 skipped - not responding)
CAMERAS = [
    {
        "id": "camera_2",
        "name": "Parking - Cam 2",
        "rtsp_url": rtsp(2),
        "sample_interval_sec": 5,
        "confidence_threshold": 0.15,
    },
    {
        "id": "camera_3",
        "name": "Parking - Cam 3",
        "rtsp_url": rtsp(3),
        "sample_interval_sec": 5,
        "confidence_threshold": 0.15,
    },
    {
        "id": "camera_4",
        "name": "Parking - Cam 4",
        "rtsp_url": rtsp(4),
        "sample_interval_sec": 5,
        "confidence_threshold": 0.15,
    },
]

# YOLO - CPU only, nano model (fastest)
YOLO_MODEL    = "yolov8s.pt"
YOLO_DEVICE   = "cpu"
YOLO_IMG_SIZE = 640

# Zone detection
ZONES_FILE        = "data/zones.json"
OVERLAP_THRESHOLD = 0.20

# Alerts: disabled
ALERT_ON_FREE      = False
ALERT_COOLDOWN_SEC = 60
TELEGRAM_BOT_TOKEN = ""
TELEGRAM_CHAT_ID   = ""

# API server
API_HOST = "0.0.0.0"
API_PORT = 8001

# Storage
DATABASE_PATH = "data/parking.db"
SNAPSHOT_DIR  = "data/snapshots"

