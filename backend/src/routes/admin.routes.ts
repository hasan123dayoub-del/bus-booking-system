import { Router } from "express";
import { z } from "zod";
import * as admin from "../controllers/admin.controller";
import * as buses from "../controllers/bus.controller";
import * as schedules from "../controllers/schedule.controller";
import * as trips from "../controllers/trip.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { busListQuery, createBusSchema, updateBusSchema } from "../validators/bus.validators";
import { dateString } from "../validators/common";
import { reportQuery } from "../validators/report.validators";
import { createScheduleSchema, updateScheduleSchema } from "../validators/schedule.validators";
import {
  adminTripsQuery,
  createTripSchema,
  tripStatusSchema,
  updateTripSchema,
} from "../validators/trip.validators";
import {
  createReceptionistSchema,
  updateReceptionistSchema,
} from "../validators/user.validators";

const router = Router();

// Everything under /api/admin is ADMIN only
router.use(authenticate, authorize("ADMIN"));

router.get("/buses", validateQuery(busListQuery), buses.list);
router.post("/buses", validateBody(createBusSchema), buses.create);
router.get("/buses/:id", buses.getOne);
router.patch("/buses/:id", validateBody(updateBusSchema), buses.update);
router.delete("/buses/:id", buses.remove);

router.get("/trips", validateQuery(adminTripsQuery), trips.adminList);
router.post("/trips", validateBody(createTripSchema), trips.create);
router.patch("/trips/:id", validateBody(updateTripSchema), trips.update);
router.delete("/trips/:id", trips.remove);
router.post("/trips/:id/cancel", trips.cancel);
router.patch("/trips/:id/status", validateBody(tripStatusSchema), trips.setStatus);

router.get("/schedules", schedules.list);
router.post("/schedules", validateBody(createScheduleSchema), schedules.create);
router.patch("/schedules/:id", validateBody(updateScheduleSchema), schedules.update);
router.delete("/schedules/:id", schedules.remove);

router.get("/receptionists", admin.listReceptionists);
router.post("/receptionists", validateBody(createReceptionistSchema), admin.createReceptionist);
router.patch("/receptionists/:id", validateBody(updateReceptionistSchema), admin.updateReceptionist);
router.delete("/receptionists/:id", admin.deleteReceptionist);

router.get("/reports/occupancy", validateQuery(reportQuery), admin.occupancy);
router.get("/reports/revenue", validateQuery(reportQuery), admin.revenue);
router.get(
  "/reports/summary",
  validateQuery(z.object({ date: dateString.optional() })),
  admin.summary,
);

export default router;
