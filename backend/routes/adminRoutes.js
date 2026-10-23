import { Router } from "express";
import {
  getDashboardStats,
  getAllBookings,
  getAllPayments,
  getAdminEvents,
  getAllUsers,
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// All admin routes strictly require admin role
router.use(requireAuth, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/dashboard", getDashboardStats);
router.get("/bookings", getAllBookings);
router.get("/payments", getAllPayments);
router.get("/events", getAdminEvents);
router.get("/users", getAllUsers);

export default router;
