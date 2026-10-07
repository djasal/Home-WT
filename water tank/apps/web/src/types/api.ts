export type Role = "ADMIN" | "USER";
export type TankStatus = "FULL" | "MEDIUM" | "LOW" | "CRITICAL";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";
export type AlertType = "LOW_LEVEL" | "HIGH_LEVEL" | "DEVICE_OFFLINE" | "SENSOR_FAILURE" | "NO_DATA";
export type AlertChannel = "EMAIL" | "PUSH" | "WEBHOOK";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type Tank = {
  id: string;
  name: string;
  location: string;
  capacityLiters: number;
  heightCm: number;
  diameterCm?: number | null;
  shape: "CYLINDER" | "RECTANGLE";
  currentPercent: number;
  currentDistanceCm: number;
  currentVolumeLiters: number;
  status: TankStatus;
  notes?: string | null;
  installationDate?: string | null;
  ownerId: string;
  devices?: Device[];
  createdAt: string;
  updatedAt: string;
};

export type Device = {
  id: string;
  deviceId: string;
  macAddress: string;
  firmwareVersion: string;
  ipAddress?: string | null;
  wifiSignal?: number | null;
  wifiSsid?: string | null;
  sensorOk?: boolean | null;
  sensorType: string;
  status: DeviceStatus;
  lastSeen?: string | null;
  tankId?: string | null;
  tank?: Tank | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Measurement = {
  id: string;
  deviceId: string;
  tankId: string;
  distanceCm: number;
  percentage: number;
  volumeLiters: number;
  wifiRssi?: number | null;
  temperatureC?: number | null;
  batteryPct?: number | null;
  recordedAt: string;
  createdAt: string;
  device?: Device;
  tank?: Tank;
};

export type Alert = {
  id: string;
  tankId?: string | null;
  tank?: Tank | null;
  type: AlertType;
  threshold?: number | null;
  channel: AlertChannel;
  enabled: boolean;
  message: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  activeTank?: Tank | null;
  tanks: Tank[];
  devices: Device[];
  latest?: Measurement | null;
  history: Measurement[];
  stats: {
    averageToday: number;
    averageWeek: number;
    highestLevel: number;
    lowestLevel: number;
  };
};

export type RealtimeMeasurementPayload = {
  measurement: Measurement;
  tank: Tank;
  device: Device;
};
