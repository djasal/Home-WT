import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError, asyncHandler } from "../utils/errors.js";

export const alertController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
    const alerts = await prisma.alert.findMany({
      where,
      include: { tank: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(alerts);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const alert = await prisma.alert.findFirst({
      where,
      include: { tank: true }
    });
    if (!alert) throw new ApiError(404, "Alert not found");
    res.json(alert);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = {
      tankId: req.body.tankId || null,
      ownerId: req.user!.id,
      type: req.body.type,
      threshold: req.body.threshold ?? null,
      channel: req.body.channel || "PUSH",
      enabled: req.body.enabled ?? true,
      message: req.body.message
    };
    const alert = await prisma.alert.create({
      data,
      include: { tank: true }
    });
    res.status(201).json(alert);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data: any = {};
    if (req.body.tankId !== undefined) data.tankId = req.body.tankId || null;
    if (req.body.type !== undefined) data.type = req.body.type;
    if (req.body.threshold !== undefined) data.threshold = req.body.threshold;
    if (req.body.channel !== undefined) data.channel = req.body.channel;
    if (req.body.enabled !== undefined) data.enabled = req.body.enabled;
    if (req.body.message !== undefined) data.message = req.body.message;

    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await prisma.alert.findFirst({ where });
    if (!existing) throw new ApiError(404, "Alert not found");

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data,
      include: { tank: true }
    });
    res.json(alert);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await prisma.alert.findFirst({ where });
    if (!existing) throw new ApiError(404, "Alert not found");
    await prisma.alert.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  })
};
