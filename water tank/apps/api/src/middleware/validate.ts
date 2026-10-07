import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type ValidationShape = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validate =
  (shape: ValidationShape) => (req: Request, _res: Response, next: NextFunction) => {
    if (shape.body) {
      req.body = shape.body.parse(req.body);
    }

    if (shape.params) {
      req.params = shape.params.parse(req.params);
    }

    if (shape.query) {
      req.query = shape.query.parse(req.query);
    }

    next();
  };
