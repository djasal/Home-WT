import sys
import os

try:
    import cv2
except ImportError:
    print("ERROR: opencv-python not installed. Run: .\\venv\\Scripts\\pip install opencv-python")
    sys.exit(1)

sys.path.insert(0, ".")
import config

print("=" * 50)
print("RTSP Validation Test")
print("=" * 50)
print(f"XVR IP: {config.DAHUA_IP}")
print()

for cam in config.CAMERAS:
    url = cam["rtsp_url"]
    safe = url.replace(config.DAHUA_PASSWORD, "****")
    print(f"Testing {cam['name']}...")
    print(f"  URL: {safe}")

    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        print("  FAILED - Could not open stream")
        print("  Check: IP, password, and that the XVR RTSP is enabled")
        cap.release()
        print()
        continue

    ret, frame = cap.read()
    if not ret or frame is None:
        print("  FAILED - Connected but no frame received")
        cap.release()
        print()
        continue

    h, w = frame.shape[:2]
    print(f"  OK - Frame received: {w}x{h}")

    os.makedirs(config.SNAPSHOT_DIR, exist_ok=True)
    snap_path = f"{config.SNAPSHOT_DIR}/{cam['id']}_snapshot.jpg"
    cv2.imwrite(snap_path, frame)
    print(f"  Snapshot saved: {snap_path}")

    cap.release()
    print()

print("=" * 50)
print("Done! Open data/snapshots/ to see the camera images.")
print("Next step: run .\\venv\\Scripts\\python test_yolo.py")
