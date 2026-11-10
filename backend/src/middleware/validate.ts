import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

/** Validates and replaces req.body with the parsed (cleaned) value. */
export const validateBody =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };

/** Validates the query string. The parsed value goes to res.locals.query (req.query is read-only in Express 5). */
export const validateQuery =
  (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    res.locals.query = schema.parse(req.query);
    next();
  };
