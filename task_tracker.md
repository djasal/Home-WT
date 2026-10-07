# 📋 Smart Home Project Task Tracker

## ✅ Completed Tasks
1. **ESP32 IoT Sensor Fixes**
   - Implemented real-time dashboard connection via WebSockets (`0.0.0.0:4000`).
   - Hardcoded WiFi bypass for the Captive Portal bug on ESP32-C3 hardware.
   - Fixed premature code execution syntax error (`ArduinoOTA` block).
2. **Unified Widget Dashboard**
   - Built the original standalone 4-widget React app (Water, Parking, Camera, Weather).
   - Fixed `localhost:4000` hardcode bug to support mobile device access across the local network (`window.location.hostname`).
   - Handled ESP32 `null` measurement faults by injecting a red "SENSOR FAULT" badge.
3. **One Portal Architecture**
   - Created a master `docker-compose.yml` to orchestrate 4 distinct microservices.
   - Containerized the Unified Dashboard (`Dockerfile` using `node:22-alpine`).
   - Cleaned up ghost/orphan containers that were blocking port `4000`.
   - Upgraded the Unified Dashboard sidebar to act as an "App Switcher" using iframes to embed the large Next.js water tank app.

## 🚧 Currently Active
- The unified infrastructure is currently running perfectly in the background via Docker!

## ⏳ Pending / Next Steps
1. Wait for physical ESP32 reconnection confirmation from the user to verify real-time data flows into the new Master Portal.
2. Confirm the Parking AI Camera stream is binding correctly to the `ParkingWidget.tsx` UI element.
