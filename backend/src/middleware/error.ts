import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ code: "NOT_FOUND", message: "المسار غير موجود" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: err.issues[0]?.message ?? "بيانات غير صالحة",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ code: "DUPLICATE", message: "القيمة موجودة مسبقاً" });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ code: "INVALID_ID", message: "معرّف غير صالح" });
  }

  console.error(err);
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: env.NODE_ENV === "production" ? "خطأ في الخادم" : String(err?.message ?? err),
  });
}
