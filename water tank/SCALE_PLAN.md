# WaterTank — Scale-Up Implementation Plan

## Current Status (What Already Works ✅)
The foundation is rock-solid. Here's what is production-ready today:
- **Database**: Full relational schema — `User → Tank → Device → Measurement`. Multi-user, multi-tank, multi-device is already modeled.
- **API**: Auth (JWT + refresh tokens), device data ingestion, real-time WebSocket events.
- **ESP32 Firmware**: OTA update, Telnet logging, WiFiManager captive portal, sensor fault reporting.
- **Dashboard**: Live water level gauge, history chart, device health badges (ONLINE/OFFLINE, SENSOR OK/FAULT).

---

## Phase 1 — Multi-Tank UI ✅ COMPLETED
**Goal:** Let a user manage their own tanks and assign devices from the web app. No more manual database seeding.

- [x] **TanksPage.tsx** — "Add Tank" / Edit / Delete modals.
- [x] **DevicesPage.tsx** — "Register Device" / Assign to Tank / Delete modals.
- [x] **DashboardPage.tsx** — Tank Selector dropdown at the top to switch between tanks. Dashboard data reloads for the selected tank.
- [x] **API wiring** — Full frontend API client methods (`createTank`, `deleteDevice`, etc.).

---

## Phase 2 — Smart Device Provisioning (Zero-Config ESP32 Setup) ✅ COMPLETED
**Goal:** Flash one firmware to every ESP32 — never hardcode WiFi credentials or Device ID again.

> [!IMPORTANT]
> The user explicitly requested that Auto-Registration is **REJECTED**. You must register the device manually in the UI first (which we just built in Phase 1).

### How It Works
1. You flash the **same firmware** to every new ESP32 (no code changes needed per board).
2. First boot → ESP32 sees no saved WiFi → broadcasts `WaterTank-Setup` hotspot.
3. You connect your phone to `WaterTank-Setup`.
4. A captive portal opens (already handled by WiFiManager) — you enter WiFi credentials.
5. **NEW:** The portal also asks for a `Device ID` (e.g. `ESP002`) and the `API URL`.
6. ESP32 saves all this to flash memory (NVS) and reboots connected to your network.
7. ESP32 starts sending measurements. If the Device ID is registered in the DB, it works. If not, the server rejects it (`401 Unauthorized` or `404 Not Found`).

### Tasks to do
- [x] Add custom WiFiManager parameters: `Device ID`, `API URL` to ESP32 firmware.
- [x] Save these to `Preferences` (ESP32 flash NVS) instead of hardcoding.
- [x] Read from NVS on boot; fall back to captive portal if missing.

---

## Phase 3 — Alerts & Notifications (Telegram) ✅ COMPLETED
**Goal:** Get notified via Telegram when your tank is low, the sensor fails, or the device goes offline.

> [!NOTE]
> The user explicitly requested **Telegram** notifications.

### Tasks to do
- [x] **AlertsPage.tsx** — Add Alert form: choose tank → choose type → set threshold % → enable.
- [x] **Alert Engine (Backend)** — After each measurement is ingested, check if any alerts for that tank are triggered.
- [x] **Telegram Integration** — Send Telegram message if an alert triggers. Includes Smart Incident debouncing.

---

## Phase 4 — Multi-User & Organizations ✅ COMPLETED
**Goal:** Multiple users each manage their own independent set of tanks and devices. An admin can see everyone.

### Tasks to do
- [x] **User Management** — Admin page to list users, invite new users, change roles.
- [x] **Row-Level Security / Scoping** — Ensure each user only sees their own tanks/devices.

---

## Phase 5 — Mobile & Remote Access (Cloudflare Tunnel) ✅ COMPLETED
**Goal:** Access your dashboard from anywhere in the world, not just your local network.

> [!NOTE]
> The user explicitly requested **Local server + Cloudflare Quick Tunnel**.

### Tasks to do
- [x] Install and configure `cloudflared` on the local server via Docker Compose.
- [x] Expose `watertank-app` using Cloudflare's TryCloudflare tunnel service.
- [x] Build an automated URL extraction script that sends the new Cloudflare URL directly to the user's Telegram bot on every server restart.
