import { z } from "zod";

export const deviceParamsSchema = z.object({
  id: z.string().min(1)
});

export const createDeviceSchema = z.object({
  deviceId: z.string().trim().min(2),
  macAddress: z.string().trim().min(8),
  firmwareVersion: z.string().trim().min(1).default("1.0.0"),
  ipAddress: z.string().trim().optional(),
  wifiSignal: z.number().int().min(-100).max(0).optional(),
  sensorType: z.string().trim().min(2).default("JSN-SR04T"),
  tankId: z.string().optional(),
  ownerId: z.string().min(1).optional()
});

export const updateDeviceSchema = createDeviceSchema.partial();
