import { Role } from "@prisma/client";
import { Router } from "express";
import { tankController } from "../controllers/tank.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createTankSchema, tankParamsSchema, updateTankSchema } from "../schemas/tank.schema.js";

export const tankRoutes = Router();

tankRoutes.use(requireAuth);
tankRoutes.get("/", tankController.list);
tankRoutes.get("/:id", validate({ params: tankParamsSchema }), tankController.get);
tankRoutes.post("/", requireRole(Role.ADMIN), validate({ body: createTankSchema }), tankController.create);
tankRoutes.put("/:id", requireRole(Role.ADMIN), validate({ params: tankParamsSchema, body: updateTankSchema }), tankController.update);
tankRoutes.delete("/:id", requireRole(Role.ADMIN), validate({ params: tankParamsSchema }), tankController.remove);
