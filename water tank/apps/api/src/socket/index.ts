import type { Measurement, Tank, Device } from "@prisma/client";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { prisma } from "../config/prisma.js";

let io: Server | undefined;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.WEB_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", async (socket) => {
    logger.info(`socket connected ${socket.id}`);
    
    try {
      const devices = await prisma.device.findMany({ include: { tank: true } });
      for (const d of devices) {
        if (!d.tank) continue;
        const latestMeas = await prisma.measurement.findFirst({
          where: { deviceId: d.id },
          orderBy: { recordedAt: 'desc' }
        });
        socket.emit("measurement:new", { measurement: latestMeas, tank: d.tank, device: d });
      }
    } catch (e) {
      logger.error("Failed to push initial state", e);
    }

    socket.on("disconnect", () => logger.info(`socket disconnected ${socket.id}`));
  });

  return io;
};

export const emitMeasurement = (payload: {
  measurement: Measurement;
  tank: Tank;
  device: Device;
}) => {
  io?.emit("measurement:new", payload);
};
