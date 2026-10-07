import { Role } from "@prisma/client";
import { Router } from "express";
import { deviceController } from "../controllers/device.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createDeviceSchema, deviceParamsSchema, updateDeviceSchema } from "../schemas/device.schema.js";

export const deviceRoutes = Router();

deviceRoutes.use(requireAuth);
deviceRoutes.get("/", deviceController.list);
deviceRoutes.get("/:id", validate({ params: deviceParamsSchema }), deviceController.get);
deviceRoutes.post("/", requireRole(Role.ADMIN), validate({ body: createDeviceSchema }), deviceController.create);
deviceRoutes.put("/:id", requireRole(Role.ADMIN), validate({ params: deviceParamsSchema, body: updateDeviceSchema }), deviceController.update);
deviceRoutes.delete("/:id", requireRole(Role.ADMIN), validate({ params: deviceParamsSchema }), deviceController.remove);

// ESP32 proxy routes — the server fetches from the device so the browser doesn't need direct LAN access
deviceRoutes.get("/:id/scan-wifi", validate({ params: deviceParamsSchema }), deviceController.scanWifi);
deviceRoutes.post("/:id/change-wifi", validate({ params: deviceParamsSchema }), deviceController.changeWifi);
