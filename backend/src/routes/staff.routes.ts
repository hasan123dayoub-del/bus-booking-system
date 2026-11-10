import { Router } from "express";
import * as bookings from "../controllers/booking.controller";
import * as trips from "../controllers/trip.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  changeSeatSchema,
  staffBookingSchema,
  staffBookingsQuery,
} from "../validators/booking.validators";
import { staffTripsQuery } from "../validators/trip.validators";

const router = Router();

// Reception work: receptionists and the admin
router.use(authenticate, authorize("ADMIN", "RECEPTIONIST"));

router.get("/trips", validateQuery(staffTripsQuery), trips.ofDay);
router.get("/trips/:id/manifest", bookings.manifest);

router.get("/bookings", validateQuery(staffBookingsQuery), bookings.list);
router.post("/bookings", validateBody(staffBookingSchema), bookings.createStaff);
router.patch("/bookings/:id/change-seat", validateBody(changeSeatSchema), bookings.changeSeat);
router.post("/bookings/:id/cancel", bookings.cancel);
router.patch("/bookings/:id/refund", bookings.refund);

export default router;
