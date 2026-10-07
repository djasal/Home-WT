import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/errors.js";

export const notFoundHandler: ErrorRequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.issues
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
    return;
  }

  logger.error(error);

  res.status(500).json({
    message: "Internal server error",
    stack: env.NODE_ENV === "development" ? error.stack : undefined
  });
};
