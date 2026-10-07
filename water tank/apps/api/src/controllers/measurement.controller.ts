import type { Request, Response } from "express";
import { measurementService } from "../services/measurement.service.js";
import { asyncHandler } from "../utils/errors.js";

export const measurementController = {
  latest: asyncHandler(async (req: Request, res: Response) => {
    const latest = await measurementService.latest(req.query.tankId as string | undefined);
    res.json(latest);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const history = await measurementService.history({
      tankId: req.query.tankId as string | undefined,
      range: req.query.range as "hour" | "today" | "7d" | "30d" | "all",
      page: req.query.page as number | undefined,
      limit: req.query.limit as number | undefined
    });
    res.json(history);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await measurementService.ingest({
      deviceId: req.body.deviceId,
      distance: req.body.distance,
      percentage: req.body.percentage,
      timestamp: req.body.timestamp,
      wifiRssi: req.body.wifiRssi,
      wifiSsid: req.body.wifiSsid,
      temperature: req.body.temperature,
      battery: req.body.battery,
      sensorOk: req.body.sensorOk,
      ipAddress: req.body.ipAddress || req.ip
    });
    res.status(201).json(result);
  })
};
