CREATE TYPE role AS ENUM ('ADMIN', 'USER');
CREATE TYPE tank_shape AS ENUM ('CYLINDER', 'RECTANGLE');
CREATE TYPE tank_status AS ENUM ('FULL', 'MEDIUM', 'LOW', 'CRITICAL');
CREATE TYPE device_status AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');
CREATE TYPE alert_type AS ENUM ('LOW_LEVEL', 'HIGH_LEVEL', 'DEVICE_OFFLINE', 'SENSOR_FAILURE', 'NO_DATA');
CREATE TYPE alert_channel AS ENUM ('EMAIL', 'PUSH', 'WEBHOOK');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tanks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity_liters DOUBLE PRECISION NOT NULL,
  height_cm DOUBLE PRECISION NOT NULL,
  diameter_cm DOUBLE PRECISION,
  length_cm DOUBLE PRECISION,
  width_cm DOUBLE PRECISION,
  shape tank_shape NOT NULL DEFAULT 'CYLINDER',
  owner_id TEXT NOT NULL REFERENCES users(id),
  current_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_distance_cm DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_volume_liters DOUBLE PRECISION NOT NULL DEFAULT 0,
  status tank_status NOT NULL DEFAULT 'MEDIUM',
  photo_url TEXT,
  notes TEXT,
  installation_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  mac_address TEXT NOT NULL UNIQUE,
  firmware_version TEXT NOT NULL,
  ip_address TEXT,
  wifi_signal INTEGER,
  sensor_type TEXT NOT NULL DEFAULT 'JSN-SR04T',
  status device_status NOT NULL DEFAULT 'OFFLINE',
  last_seen TIMESTAMP,
  tank_id TEXT REFERENCES tanks(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  tank_id TEXT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  distance_cm DOUBLE PRECISION NOT NULL,
  percentage DOUBLE PRECISION NOT NULL,
  volume_liters DOUBLE PRECISION NOT NULL,
  wifi_rssi INTEGER,
  temperature_c DOUBLE PRECISION,
  battery_pct DOUBLE PRECISION,
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  tank_id TEXT REFERENCES tanks(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  threshold DOUBLE PRECISION,
  channel alert_channel NOT NULL DEFAULT 'EMAIL',
  enabled BOOLEAN NOT NULL DEFAULT true,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  alert_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status notification_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  sent_at TIMESTAMP
);

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  unit TEXT NOT NULL DEFAULT 'liters',
  distance_unit TEXT NOT NULL DEFAULT 'cm',
  timezone TEXT NOT NULL DEFAULT 'Africa/Algiers',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX measurements_tank_recorded_idx ON measurements(tank_id, recorded_at);
CREATE INDEX measurements_device_recorded_idx ON measurements(device_id, recorded_at);
