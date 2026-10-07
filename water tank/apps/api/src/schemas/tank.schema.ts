import { TankShape } from "@prisma/client";
import { z } from "zod";

export const tankParamsSchema = z.object({
  id: z.string().min(1)
});

export const createTankSchema = z.object({
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
  capacityLiters: z.number().positive(),
  heightCm: z.number().positive(),
  diameterCm: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  shape: z.nativeEnum(TankShape).default(TankShape.CYLINDER),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  installationDate: z.string().datetime().optional(),
  ownerId: z.string().min(1).optional()
});

export const updateTankSchema = createTankSchema.partial();
