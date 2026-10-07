import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/errors.js";

export const dashboardController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await dashboardService.summary(
      req.user!,
      (req.query.range as "hour" | "today" | "7d" | "30d") ?? "today",
      req.query.tankId as string | undefined
    );
    res.json(summary);
  }),

  analytics: asyncHandler(async (req: Request, res: Response) => {
    // We import locally to avoid circular dependencies if any, or just import at top
    const { analyticsService } = await import("../services/analytics.service.js");
    const stats = await analyticsService.getFleetAnalytics(req.user!);
    res.json(stats);
  })
};
