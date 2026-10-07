import { z } from "zod";

export const alertTypeSchema = z.enum([
  "LOW_LEVEL",
  "HIGH_LEVEL",
  "DEVICE_OFFLINE",
  "SENSOR_FAILURE",
  "NO_DATA"
]);

export const alertChannelSchema = z.enum(["EMAIL", "PUSH", "WEBHOOK"]);

export const createAlertSchema = z.object({
  tankId: z.string().optional().nullable(),
  type: alertTypeSchema,
  threshold: z.number().optional().nullable(),
  channel: alertChannelSchema.default("PUSH"),
  enabled: z.boolean().default(true),
  message: z.string().min(1, "Message is required")
});

export const updateAlertSchema = createAlertSchema.partial();

export const alertParamsSchema = z.object({
  id: z.string()
});
