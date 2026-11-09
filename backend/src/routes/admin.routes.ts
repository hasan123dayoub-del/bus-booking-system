import { Router } from "express";
import * as buses from "../controllers/bus.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createBusSchema, updateBusSchema } from "../validators/bus.validators";

const router = Router();

// Everything under /api/admin is ADMIN only
router.use(authenticate, authorize("ADMIN"));

router.get("/buses", buses.list);
router.post("/buses", validateBody(createBusSchema), buses.create);
router.get("/buses/:id", buses.getOne);
router.patch("/buses/:id", validateBody(updateBusSchema), buses.update);
router.delete("/buses/:id", buses.remove);

// TODO: /trips, /schedules, /receptionists, /reports

export default router;
