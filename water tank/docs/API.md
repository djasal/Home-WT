# Phase 1 API

Base URL: `http://localhost:4000/api`

## Authentication

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account. The first account becomes `ADMIN`. |
| POST | `/auth/login` | Public | Return user, access token, and refresh token. |
| POST | `/auth/refresh` | Public | Rotate refresh token and return a new session. |
| GET | `/auth/me` | Bearer token | Return current user. |

## Dashboard

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/dashboard?range=today` | Bearer token | Summary, latest reading, devices, tanks, and chart history. |

`range` can be `hour`, `today`, `7d`, or `30d`.

## Tanks

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/tanks` | Bearer token | List tanks. |
| GET | `/tanks/:id` | Bearer token | Get one tank. |
| POST | `/tanks` | Admin | Create a tank. |
| PUT | `/tanks/:id` | Admin | Update a tank. |
| DELETE | `/tanks/:id` | Admin | Delete a tank. |

## Devices

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/devices` | Bearer token | List ESP32 devices. |
| GET | `/devices/:id` | Bearer token | Get one device. |
| POST | `/devices` | Admin | Register a device. |
| PUT | `/devices/:id` | Admin | Update a device. |
| DELETE | `/devices/:id` | Admin | Delete a device. |

## Measurements

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/measurements/latest` | Bearer token | Latest measurement. |
| GET | `/measurements/history?range=today` | Bearer token | Measurement history. |
| POST | `/measurements` | Admin | Manual measurement insert. |

## ESP32 Ingestion

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/device/data` | `x-device-token` | Store telemetry from ESP32. |

Body:

```json
{
  "deviceId": "ESP001",
  "distance": 53.6,
  "percentage": 74.2,
  "wifiRssi": -58,
  "timestamp": "2026-07-04T14:00:00Z"
}
```

## Socket.IO

Server URL: `http://localhost:4000`

Event:

```text
measurement:new
```

Payload:

```json
{
  "measurement": {},
  "tank": {},
  "device": {}
}
```
