import { Request, Response } from "express";
import { CITIES } from "../constants";

export function listCities(_req: Request, res: Response) {
  res.json({ cities: CITIES });
}
