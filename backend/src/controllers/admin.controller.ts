import { Request, Response } from "express";
import * as reportService from "../services/report.service";
import * as userService from "../services/user.service";
import { idParam, query, send } from "../utils/http";

// Receptionists
export async function listReceptionists(_req: Request, res: Response) {
  send(res, await userService.listReceptionists());
}

export async function createReceptionist(req: Request, res: Response) {
  send(res, await userService.createReceptionist(req.body), 201);
}

export async function updateReceptionist(req: Request, res: Response) {
  send(res, await userService.updateReceptionist(idParam(req), req.body));
}

export async function deleteReceptionist(req: Request, res: Response) {
  await userService.deleteReceptionist(idParam(req));
  res.status(204).end();
}

// Reports
export async function occupancy(_req: Request, res: Response) {
  const q = query<{ from: string; to: string }>(res);
  send(res, await reportService.occupancy(q.from, q.to));
}

export async function revenue(_req: Request, res: Response) {
  const q = query<{ from: string; to: string }>(res);
  send(res, await reportService.revenue(q.from, q.to));
}

export async function summary(_req: Request, res: Response) {
  send(res, await reportService.summary(query<{ date?: string }>(res).date));
}
