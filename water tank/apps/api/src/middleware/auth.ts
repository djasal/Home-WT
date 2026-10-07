import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/errors.js";

type AccessPayload = {
  sub: string;
  name: string;
  email: string;
  role: Role;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    next(new ApiError(401, "Missing access token"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }

    next();
  };

export const requireDeviceToken = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers["x-device-token"] ?? req.headers.authorization?.replace("Bearer ", "");

  if (token !== env.DEVICE_INGEST_TOKEN) {
    next(new ApiError(401, "Invalid device token"));
    return;
  }

  next();
};
