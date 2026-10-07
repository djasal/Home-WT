import { z } from "zod";

export const historyQuerySchema = z.object({
  tankId: z.string().optional(),
  range: z.enum(["hour", "today", "7d", "30d", "all"]).default("today"),
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("100")
});

export const latestQuerySchema = z.object({
  tankId: z.string().optional()
});

export const measurementBodySchema = z.object({
  deviceId: z.string().trim().min(2),
  // distance can be -1.0 when the sensor is in a fault/offline state
  distance: z.number(),
  // percentage is 0 when sensor is faulted, so allow 0 explicitly
  percentage: z.number().min(0).max(100),
  timestamp: z.string().datetime().optional(),
  wifiRssi: z.number().int().min(-100).max(0).optional(),
  temperature: z.number().optional(),
  battery: z.number().min(0).max(100).optional(),
  ipAddress: z.string().ip().or(z.string().regex(/^::ffff:\d+\.\d+\.\d+\.\d+$/)).optional(),
  wifiSsid: z.string().optional(),
  sensorOk: z.boolean().optional()
});
