import { Request, Response } from "express";
import * as bookingService from "../services/booking.service";
import { idParam, query, send, userId } from "../utils/http";

// Customer
export async function createApp(req: Request, res: Response) {
  send(res, await bookingService.createAppBooking(userId(req), req.body), 201);
}

export async function mine(req: Request, res: Response) {
  send(res, await bookingService.myBookings(userId(req)));
}

export async function cancelMine(req: Request, res: Response) {
  send(res, await bookingService.cancelByCustomer(userId(req), idParam(req)));
}

// Staff
export async function createStaff(req: Request, res: Response) {
  send(res, await bookingService.createStaffBooking(userId(req), req.body), 201);
}

export async function list(_req: Request, res: Response) {
  // Already { data, meta }
  res.json(await bookingService.listStaffBookings(query(res)));
}

export async function changeSeat(req: Request, res: Response) {
  send(res, await bookingService.changeSeat(idParam(req), req.body));
}

export async function cancel(req: Request, res: Response) {
  send(res, await bookingService.cancelByStaff(idParam(req)));
}

export async function refund(req: Request, res: Response) {
  send(res, await bookingService.markRefunded(idParam(req)));
}

export async function manifest(req: Request, res: Response) {
  send(res, await bookingService.manifest(idParam(req)));
}
