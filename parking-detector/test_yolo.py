import sys
import os

try:
    from ultralytics import YOLO
    import cv2
except ImportError as e:
    print(f"ERROR: {e}. Wait for pip install to finish.")
    sys.exit(1)

sys.path.insert(0, ".")
import config

print("=" * 60)
print("Parking Detector - YOLO Detection Test")
print("=" * 60)
print(f"Model: {config.YOLO_MODEL} (downloading if first run...)")
print()

# Load model (downloads automatically on first run)
model = YOLO(config.YOLO_MODEL)
print("Model loaded OK")
print()

# Test on each saved snapshot
CAR_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}

for cam in config.CAMERAS:
    snap = f"{config.SNAPSHOT_DIR}/{cam['id']}_snapshot.jpg"
    if not os.path.exists(snap):
        print(f"{cam['name']}: No snapshot found - run test_rtsp.py first")
        continue

    print(f"Testing {cam['name']}...")
    frame = cv2.imread(snap)
    results = model(frame, conf=cam["confidence_threshold"], device="cpu", verbose=False)[0]

    vehicles = []
    for box in results.boxes:
        cls = int(box.cls[0])
        if cls in CAR_CLASSES:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            vehicles.append({"type": CAR_CLASSES[cls], "conf": conf, "box": (x1, y1, x2, y2)})
            # Draw box on image
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{CAR_CLASSES[cls]} {conf:.2f}", (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    out_path = f"{config.SNAPSHOT_DIR}/{cam['id']}_yolo.jpg"
    cv2.imwrite(out_path, frame)

    print(f"  Vehicles detected: {len(vehicles)}")
    for v in vehicles:
        print(f"    {v['type']} @ conf={v['conf']:.2f}  box={v['box']}")
    print(f"  Annotated image: {out_path}")
    print()

print("=" * 60)
print("Done! Check the annotated images in data/snapshots/")
print("If cars are detected correctly, proceed to Phase 1 (zone editor).")
print("If detection misses cars or has wrong boxes, we can tune confidence.")
