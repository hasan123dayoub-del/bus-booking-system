import { Request, Response } from "express";
import * as tripService from "../services/trip.service";
import { idParam, query, send } from "../utils/http";

// Public
export async function search(_req: Request, res: Response) {
  send(res, await tripService.searchTrips(query(res)));
}

export async function getOne(req: Request, res: Response) {
  send(res, await tripService.getTrip(idParam(req)));
}

// Staff
export async function ofDay(_req: Request, res: Response) {
  send(res, await tripService.tripsOfDay(query(res)));
}

// Admin
export async function adminList(_req: Request, res: Response) {
  send(res, await tripService.adminListTrips(query(res)));
}

export async function create(req: Request, res: Response) {
  send(res, await tripService.createTrip(req.body), 201);
}

export async function update(req: Request, res: Response) {
  send(res, await tripService.updateTrip(idParam(req), req.body));
}

export async function remove(req: Request, res: Response) {
  await tripService.deleteTrip(idParam(req));
  res.status(204).end();
}

export async function cancel(req: Request, res: Response) {
  send(res, await tripService.cancelTrip(idParam(req)));
}

export async function setStatus(req: Request, res: Response) {
  send(res, await tripService.setTripStatus(idParam(req), req.body.status));
}
