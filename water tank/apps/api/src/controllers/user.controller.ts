import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { ApiError, asyncHandler } from "../utils/errors.js";

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(400, "User already exists");

    const passwordHash = await bcrypt.hash(password || "ChangeMe123!", 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || "USER" },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { name, role, password } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (req.params.id === req.user!.id) {
      throw new ApiError(400, "Cannot delete yourself");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
};
