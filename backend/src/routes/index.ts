import { Router } from "express";
import * as bookings from "../controllers/booking.controller";
import { listBusTypes, listCities } from "../controllers/city.controller";
import * as trips from "../controllers/trip.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { appBookingSchema } from "../validators/booking.validators";
import { searchTripsQuery } from "../validators/trip.validators";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import staffRoutes from "./staff.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ data: { ok: true } }));

// Public
router.get("/cities", listCities);
router.get("/bus-types", listBusTypes);
router.get("/trips", validateQuery(searchTripsQuery), trips.search);
router.get("/trips/:id", trips.getOne);

router.use("/auth", authRoutes);

// Customer (mobile app)
const customer = [authenticate, authorize("CUSTOMER")];
router.post("/bookings", ...customer, validateBody(appBookingSchema), bookings.createApp);
router.get("/me/bookings", ...customer, bookings.mine);
router.post("/bookings/:id/cancel", ...customer, bookings.cancelMine);

// Office and admin
router.use("/staff", staffRoutes);
router.use("/admin", adminRoutes);

export default router;
