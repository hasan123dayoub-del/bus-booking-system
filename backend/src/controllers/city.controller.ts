import { Request, Response } from "express";
import { BUS_TYPES, CITIES } from "../constants";
import { send } from "../utils/http";

export function listCities(_req: Request, res: Response) {
  send(res, CITIES);
}

export function listBusTypes(_req: Request, res: Response) {
  send(res, BUS_TYPES);
}
