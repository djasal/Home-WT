import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { tankRepository } from "../repositories/tank.repository.js";
import { ApiError, asyncHandler } from "../utils/errors.js";

const toTankCreateInput = (body: Record<string, unknown>, ownerId: string): Prisma.TankCreateInput => ({
  name: body.name as string,
  location: body.location as string,
  capacityLiters: body.capacityLiters as number,
  heightCm: body.heightCm as number,
  diameterCm: body.diameterCm as number | undefined,
  lengthCm: body.lengthCm as number | undefined,
  widthCm: body.widthCm as number | undefined,
  shape: body.shape as Prisma.TankCreateInput["shape"],
  photoUrl: body.photoUrl as string | undefined,
  notes: body.notes as string | undefined,
  installationDate: body.installationDate ? new Date(body.installationDate as string) : undefined,
  owner: { connect: { id: body.ownerId ? (body.ownerId as string) : ownerId } }
});

const toTankUpdateInput = (body: Record<string, unknown>): Prisma.TankUpdateInput => {
  const { ownerId, installationDate, ...rest } = body;
  const updateInput: Prisma.TankUpdateInput = {
    ...rest,
    installationDate: installationDate ? new Date(installationDate as string) : undefined
  };
  if (ownerId) updateInput.owner = { connect: { id: ownerId as string } };
  return updateInput;
};

export const tankController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? {} : { ownerId: req.user!.id };
    res.json(await tankRepository.list(where));
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const tank = await tankRepository.findFirst(where);
    if (!tank) {
      throw new ApiError(404, "Tank not found");
    }
    res.json(tank);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const tank = await tankRepository.create(toTankCreateInput(req.body, req.user!.id));
    res.status(201).json(tank);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    console.log("UPDATE TANK - req.body:", req.body);
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await tankRepository.findFirst(where);
    if (!existing) throw new ApiError(404, "Tank not found");
    const input = toTankUpdateInput(req.body);
    console.log("UPDATE TANK - updateInput:", JSON.stringify(input, null, 2));
    const tank = await tankRepository.update({ id: req.params.id }, input);
    console.log("UPDATE TANK - updated tank:", tank);
    res.json(tank);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const where = req.user!.role === "ADMIN" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
    const existing = await tankRepository.findFirst(where);
    if (!existing) throw new ApiError(404, "Tank not found");
    await tankRepository.remove({ id: req.params.id });
    res.status(204).send();
  })
};
