# Smart Home Portal - Merge Plan

Currently, the project is fragmented across multiple standalone pieces:
1. **The 4-Split Dashboard**: A standalone Vite React app (port 5174).
2. **The Water Tank Dashboard**: A full-stack Dockerized app with Auth & Routing (port 5173).
3. **The Parking AI**: A standalone Python/FastAPI backend (port 8001).
4. **The Camera Bridge**: A standalone MediaMTX RTSP bridge (port 8554).

## The Goal: "One App, One Portal"
We will merge everything into a single, unified **Master Portal** using the existing Dockerized infrastructure. You will log in once, and use a sidebar to navigate between the "Unified Overview" (the 4-split), the detailed Water Tank app, the Parking app, and the Settings.

---

## Phase 1: Frontend Consolidation (The Portal)
We will make `water tank/apps/web` the absolute Master Frontend.
1. **Home/Overview Route (`/`)**: We will migrate the beautiful 4-split layout (Door Camera, Parking Spot, Weather, Water Tank widgets) to become the default landing page of the Master Portal.
2. **Water Tank Route (`/watertank`)**: The existing detailed Water Tank dashboard (with charts and history) will be moved to its own dedicated tab.
3. **Parking Route (`/parking`)**: We will build out the detailed parking page using the existing YOLOv10 Python backend.
4. **Asset Migration**: We will port the custom CSS (`components.css`) and the React Widgets (`CameraWidget`, `ParkingWidget`, `WeatherWidget`) directly into the Master Portal's component library.

## Phase 2: Master Docker Orchestration
Right now, you have to run `docker-compose up` in the `water tank` folder, the `parking-detector` folder, and the `camera-bridge` folder separately.
1. We will create a **Master `docker-compose.yml`** at the root of `d:\Home dashboard`.
2. This single file will orchestrate:
   - The PostgreSQL Database
   - The Node.js API Backend
   - The React Web Portal
   - The MediaMTX Camera Bridge
   - The Python YOLOv10 Parking Detector
3. **Result**: You will only ever need to run *one* command (`docker-compose up -d`) to launch your entire Smart Home ecosystem.

## Phase 3: Cleanup
Once the Master Portal is running beautifully and routing to all your apps, we can safely delete the old standalone `d:\Home dashboard\dashboard` folder to keep your codebase clean and organized.

---

**Do you approve of this architectural plan?** If so, click "Proceed" and I will begin Phase 1 immediately by porting the 4-split dashboard into the Master Portal!
