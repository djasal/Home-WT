import { Router } from "express";
import { alertRoutes } from "./alert.routes.js";
import { userRoutes } from "./user.routes.js";
import { authRoutes } from "./auth.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { deviceRoutes } from "./device.routes.js";
import { deviceIngestRoutes, measurementRoutes } from "./measurement.routes.js";
import { tankRoutes } from "./tank.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/dashboard", dashboardRoutes);
apiRoutes.use("/tanks", tankRoutes);
apiRoutes.use("/devices", deviceRoutes);
apiRoutes.use("/measurements", measurementRoutes);
apiRoutes.use("/device", deviceIngestRoutes);
apiRoutes.use("/alerts", alertRoutes);
apiRoutes.use("/users", userRoutes);
