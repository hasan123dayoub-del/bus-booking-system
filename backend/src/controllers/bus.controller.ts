import { Request, Response } from "express";
import * as busService from "../services/bus.service";
import { idParam, query, send } from "../utils/http";

export async function list(_req: Request, res: Response) {
  send(res, await busService.listBuses(query(res)));
}

export async function getOne(req: Request, res: Response) {
  send(res, await busService.getBus(idParam(req)));
}

export async function create(req: Request, res: Response) {
  send(res, await busService.createBus(req.body), 201);
}

export async function update(req: Request, res: Response) {
  send(res, await busService.updateBus(idParam(req), req.body));
}

export async function remove(req: Request, res: Response) {
  await busService.deleteBus(idParam(req));
  res.status(204).end();
}
