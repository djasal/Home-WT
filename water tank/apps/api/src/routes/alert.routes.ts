import { Role } from "@prisma/client";
import { Router } from "express";
import { alertController } from "../controllers/alert.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { alertParamsSchema, createAlertSchema, updateAlertSchema } from "../schemas/alert.schema.js";

export const alertRoutes = Router();

alertRoutes.use(requireAuth);
alertRoutes.get("/", alertController.list);
alertRoutes.get("/:id", validate({ params: alertParamsSchema }), alertController.get);
alertRoutes.post("/", requireRole(Role.ADMIN), validate({ body: createAlertSchema }), alertController.create);
alertRoutes.put("/:id", requireRole(Role.ADMIN), validate({ params: alertParamsSchema, body: updateAlertSchema }), alertController.update);
alertRoutes.delete("/:id", requireRole(Role.ADMIN), validate({ params: alertParamsSchema }), alertController.remove);
