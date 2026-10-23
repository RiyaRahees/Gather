import { Router } from "express";
import {
  getMyTickets,
  getBookingTickets,
  getTicketById,
  adminVerifyTicket,
  adminConfirmCheckIn,
} from "../controllers/ticketController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// User routes (protected)
router.get("/my", requireAuth, getMyTickets);
router.get("/booking/:bookingId", requireAuth, getBookingTickets);
router.get("/:id", requireAuth, getTicketById);

// Admin check-in routes (admin protected)
router.post("/admin/verify", requireAuth, requireAdmin, adminVerifyTicket);
router.post("/admin/check-in", requireAuth, requireAdmin, adminConfirmCheckIn);

export default router;
