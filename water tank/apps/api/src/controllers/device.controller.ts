import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { deviceRepository } from "../repositories/device.repository.js";
import { ApiError, asyncHandler } from "../utils/errors.js";

const toDeviceCreateInput = (body: Record<string, unknown>, ownerId: string): Prisma.DeviceCreateInput => ({
  deviceId: body.deviceId as string,
  macAddress: body.macAddress as string,
  firmwareVersion: body.firmwareVersion as string,
  ipAddress: body.ipAddress as string | undefined,
  wifiSignal: body.wifiSignal as number | undefined,
  sensorType: body.sensorType as string,
  tank: body.tankId ? { connect: { id: body.tankId as string } } : undefined,
  owner: { connect: { id: body.ownerId ? (body.ownerId as string) : ownerId } }
});

const toDeviceUpdateInput = (body: Record<string, unknown>): Prisma.DeviceUpdateInput => {
  const { tankId, ownerId, ...rest } = body;
  const updateInput: Prisma.DeviceUpdateInput = {
    ...rest,
    tank: tankId !== undefined ? (tankId ? { connect: { id: tankId as string } } : { disconnect: true }) : undefined
  };
  if (ownerId) updateInput.owner = { connect: { id: ownerId as string } };
  return updateInput;
};

export const deviceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
    res.json(await deviceRepository.list(where));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const device = await deviceRepository.findFirst(where);
    if (!device) {
      throw new ApiError(404, "Device not found");
    }
    res.json(device);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const device = await deviceRepository.create(toDeviceCreateInput(req.body, req.user!.id));
    res.status(201).json(device);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await deviceRepository.findFirst(where);
    if (!existing) throw new ApiError(404, "Device not found");
    const device = await deviceRepository.update({ id: req.params.id }, toDeviceUpdateInput(req.body));
    res.json(device);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await deviceRepository.findFirst(where);
    if (!existing) throw new ApiError(404, "Device not found");
    await deviceRepository.remove({ id: req.params.id });
    res.status(204).send();
  }),

  scanWifi: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const device = await deviceRepository.findFirst(where);
    if (!device) throw new ApiError(404, "Device not found");
    if (!device.ipAddress) throw new ApiError(422, "Device has no IP address recorded yet");

    try {
      // Give the ESP32 up to 10 s — WiFi.scanNetworks() blocks for ~2-5 s
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const espRes = await fetch(`http://${device.ipAddress}/scan-wifi`, {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!espRes.ok) throw new ApiError(502, "ESP32 returned an error");
      const data = await espRes.json() as { networks?: unknown[] };
      res.json(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(504, "Could not reach device — make sure the server is on the same local network as the ESP32");
    }
  }),

  changeWifi: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const device = await deviceRepository.findFirst(where);
    if (!device) throw new ApiError(404, "Device not found");
    if (!device.ipAddress) throw new ApiError(422, "Device has no IP address recorded yet");

    const { ssid, password } = req.body as { ssid?: string; password?: string };
    if (!ssid) throw new ApiError(400, "ssid is required");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const espRes = await fetch(`http://${device.ipAddress}/change-wifi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, password: password ?? "" }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!espRes.ok) throw new ApiError(502, "ESP32 returned an error");
      const data = await espRes.json();
      res.json(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(504, "Could not reach device — make sure the server is on the same local network as the ESP32");
    }
  })
};
