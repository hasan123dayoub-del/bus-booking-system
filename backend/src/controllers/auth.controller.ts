import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { User } from "../models";
import { AppError } from "../utils/appError";

export async function register(req: Request, res: Response) {
  const { user, token } = await authService.registerCustomer(req.body);
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response) {
  const { user, token } = await authService.login(req.body.phone, req.body.password);
  res.json({ user, token });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "المستخدم غير موجود");
  res.json({ user });
}
