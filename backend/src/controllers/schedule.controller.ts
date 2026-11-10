import { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service";
import { idParam, send } from "../utils/http";

export async function list(_req: Request, res: Response) {
  send(res, await scheduleService.listSchedules());
}

export async function create(req: Request, res: Response) {
  send(res, await scheduleService.createSchedule(req.body), 201);
}

export async function update(req: Request, res: Response) {
  send(res, await scheduleService.updateSchedule(idParam(req), req.body));
}

export async function remove(req: Request, res: Response) {
  await scheduleService.deleteSchedule(idParam(req));
  res.status(204).end();
}
