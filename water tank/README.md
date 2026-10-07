# WaterTank Monitor

Phase 1 implementation of a modern IoT water tank monitoring platform.

## Phase 1 Scope

- React 19 + TypeScript + Vite dashboard
- TailwindCSS + shadcn/ui-style components
- Express + TypeScript API
- Prisma ORM with PostgreSQL
- JWT access tokens and refresh tokens
- Admin/User roles
- One seeded tank and one seeded ESP32 device
- REST ingestion endpoint for ESP32 telemetry
- Socket.IO realtime dashboard updates
- Recharts history chart with CSV export
- Local Docker PostgreSQL setup

Phase 2 and Phase 3 features are kept as navigation placeholders so the product path is visible without bloating the first testable build.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop, or another local PostgreSQL 16 instance

## Local Setup

1. Create an environment file:

   ```bash
   copy .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Generate Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Create the database tables:

   ```bash
   npm run db:migrate -- --name init
   ```

6. Seed local test data:

   ```bash
   npm run db:seed
   ```

7. Run the API and web app:

   ```bash
   npm run dev
   ```

8. In a second terminal, simulate one ESP32:

   ```bash
   npm run simulate:esp32
   ```

## Local URLs

- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/health

Seeded login:

- Email: `admin@watertank.local`
- Password: `Admin123!`

Seeded device:

- Device ID: `ESP001`
- Device token header: `x-device-token: local-device-token`

## ESP32 Payload

```http
POST /api/device/data
x-device-token: local-device-token
content-type: application/json
```

```json
{
  "deviceId": "ESP001",
  "distance": 53.6,
  "percentage": 74.2,
  "wifiRssi": -58,
  "timestamp": "2026-07-04T14:00:00Z"
}
```

The backend stores the measurement, updates the linked tank and device health, then emits `measurement:new` through Socket.IO.

## Project Structure

```text
apps/
  api/
    prisma/
      schema.prisma
      seed.ts
    scripts/
      esp32-simulator.ts
    src/
      controllers/
      middleware/
      repositories/
      routes/
      schemas/
      services/
      socket/
  web/
    src/
      components/
      hooks/
      lib/
      pages/
      types/
docs/
  API.md
  phase1-schema.sql
```

## Useful Commands

```bash
npm run check
npm run build
npm run dev:api
npm run dev:web
npm run db:seed
npm run simulate:esp32
```
