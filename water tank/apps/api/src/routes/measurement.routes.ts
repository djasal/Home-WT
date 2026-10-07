import { Role } from "@prisma/client";
import { Router } from "express";
import { measurementController } from "../controllers/measurement.controller.js";
import { requireAuth, requireDeviceToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { historyQuerySchema, latestQuerySchema, measurementBodySchema } from "../schemas/measurement.schema.js";

export const measurementRoutes = Router();
export const deviceIngestRoutes = Router();

measurementRoutes.use(requireAuth);
measurementRoutes.get("/latest", validate({ query: latestQuerySchema }), measurementController.latest);
measurementRoutes.get("/history", validate({ query: historyQuerySchema }), measurementController.history);
measurementRoutes.post("/", requireRole(Role.ADMIN), validate({ body: measurementBodySchema }), measurementController.create);

deviceIngestRoutes.post("/data", requireDeviceToken, validate({ body: measurementBodySchema }), measurementController.create);
