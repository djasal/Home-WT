import type { DashboardSummary, Device, Session, Tank, User, Alert } from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "watertank.accessToken";
const REFRESH_TOKEN_KEY = "watertank.refreshToken";

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setSession: (session: Session) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const request = async <T>(path: string, init: RequestInit = {}, retry = true): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401 && retry && tokenStore.getRefreshToken()) {
    const refreshed = await refreshSession();
    tokenStore.setSession(refreshed);
    return request<T>(path, init, false);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiClientError(body.message ?? "Request failed", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const refreshSession = async () => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new ApiClientError("Missing refresh token", 401);
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    tokenStore.clear();
    throw new ApiClientError("Session expired", 401);
  }

  return response.json() as Promise<Session>;
};

export const api = {
  login: (input: { email: string; password: string }) =>
    request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  register: (input: { name: string; email: string; password: string }) =>
    request<Session>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  me: () => request<User>("/auth/me"),

  dashboard: (range: "hour" | "today" | "7d" | "30d", tankId?: string) =>
    request<DashboardSummary>(`/dashboard?range=${range}${tankId ? `&tankId=${tankId}` : ""}`),
    
  analytics: () => request<{ totalTanks: number; totalCapacity: number; currentStored: number; averageHealth: number; alertsCount: number; tanks: any[] }>("/dashboard/analytics"),

  history: (tankId?: string, range: string = "today", page: number = 1, limit: number = 100) =>
    request<{ items: Measurement[]; total: number; page: number; limit: number }>(`/measurements/history?range=${range}&page=${page}&limit=${limit}${tankId ? `&tankId=${tankId}` : ""}`),

  // --- Tanks ---
  tanks: () => request<Tank[]>("/tanks"),
  createTank: (input: { name: string; location: string; capacityLiters: number; heightCm: number; shape: "CYLINDER" | "RECTANGLE"; diameterCm?: number; lengthCm?: number; widthCm?: number; notes?: string; ownerId?: string }) =>
    request<Tank>("/tanks", { method: "POST", body: JSON.stringify(input) }),
  updateTank: (id: string, input: any) =>
    request<Tank>(`/tanks/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteTank: (id: string) =>
    request<void>(`/tanks/${id}`, { method: "DELETE" }),

  // --- Devices ---
  devices: () => request<Device[]>("/devices"),
  createDevice: (input: { deviceId: string; macAddress: string; firmwareVersion: string; sensorType?: string; tankId?: string; ownerId?: string }) =>
    request<Device>("/devices", { method: "POST", body: JSON.stringify(input) }),
  updateDevice: (id: string, input: any) =>
    request<Device>(`/devices/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteDevice: (id: string) =>
    request<void>(`/devices/${id}`, { method: "DELETE" }),

  scanWifi: (deviceId: string) =>
    request<{ networks: { ssid: string; rssi: number; encryption: string }[] }>(
      `/devices/${deviceId}/scan-wifi`
    ),

  changeWifi: (deviceId: string, ssid: string, password: string) =>
    request<{ status: string; message: string }>(`/devices/${deviceId}/change-wifi`, {
      method: "POST",
      body: JSON.stringify({ ssid, password })
    }),

  // --- Alerts ---
  alerts: () => request<Alert[]>("/alerts"),
  createAlert: (input: { tankId?: string; type: string; threshold?: number | null; channel?: string; enabled?: boolean; message: string }) =>
    request<Alert>("/alerts", { method: "POST", body: JSON.stringify(input) }),
  updateAlert: (id: string, input: any) =>
    request<Alert>(`/alerts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteAlert: (id: string) =>
    request<void>(`/alerts/${id}`, { method: "DELETE" }),

  // --- Users ---
  users: () => request<User[]>("/users"),
  createUser: (input: { name: string; email: string; password?: string; role?: string }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(input) }),
  updateUser: (id: string, input: { name?: string; role?: string; password?: string }) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, { method: "DELETE" })
};

export { API_URL, ApiClientError };
