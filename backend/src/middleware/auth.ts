import { NextFunction, Request, Response } from "express";
import { Role } from "../constants";
import { User } from "../models";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHENTICATED", "سجّل الدخول أولاً");
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "انتهت الجلسة، سجّل الدخول من جديد");
  }

  const user = await User.findById(payload.sub).select("role active");
  if (!user || !user.active) {
    throw new AppError(401, "UNAUTHENTICATED", "الحساب غير متاح");
  }

  req.user = { id: user.id, role: user.role as Role };
  next();
}

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "لا تملك صلاحية لهذه العملية");
    }
    next();
  };
