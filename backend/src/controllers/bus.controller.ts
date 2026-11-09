import { Request, Response } from "express";
import * as busService from "../services/bus.service";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const idOf = (req: Request) => String(req.params.id);

export async function list(req: Request, res: Response) {
  const buses = await busService.listBuses({
    busClass: str(req.query.busClass),
    size: str(req.query.size),
    status: str(req.query.status),
  });
  res.json({ buses });
}

export async function getOne(req: Request, res: Response) {
  res.json({ bus: await busService.getBus(idOf(req)) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ bus: await busService.createBus(req.body) });
}

export async function update(req: Request, res: Response) {
  res.json({ bus: await busService.updateBus(idOf(req), req.body) });
}

export async function remove(req: Request, res: Response) {
  await busService.deleteBus(idOf(req));
  res.status(204).end();
}
