import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/errors.js";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const session = await authService.register(req.body);
    res.status(201).json(session);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const session = await authService.login(req.body);
    res.json(session);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const session = await authService.refresh(req.body.refreshToken);
    res.json(session);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    res.json(user);
  })
};
