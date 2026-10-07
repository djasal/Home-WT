import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { historyQuerySchema } from "../schemas/measurement.schema.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", requireAuth, validate({ query: historyQuerySchema.pick({ range: true }) }), dashboardController.summary);
dashboardRoutes.get("/analytics", requireAuth, dashboardController.analytics);
