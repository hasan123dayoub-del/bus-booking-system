import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { User } from "../models";
import { AppError } from "../utils/AppError";
import { send, userId } from "../utils/http";

export async function register(req: Request, res: Response) {
  send(res, await authService.registerCustomer(req.body), 201);
}

export async function login(req: Request, res: Response) {
  send(res, await authService.login(req.body.phone, req.body.password));
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(userId(req));
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "المستخدم غير موجود");
  send(res, { user });
}
