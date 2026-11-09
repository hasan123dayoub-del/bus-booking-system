import { Router } from "express";
import { listCities } from "../controllers/city.controller";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.get("/cities", listCities);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

// TODO: /trips, /bookings, /me/bookings, /staff

export default router;
