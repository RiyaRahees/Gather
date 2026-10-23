import { Router } from "express";
import {
  createBooking,
  verifyPayment,
  getUserBookings,
  cancelBooking,
  getCancelInfo,
  cancelBookingByToken,
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public token-based cancellation routes (accessed securely from user's private email)
router.get("/cancel-info", getCancelInfo);
router.post("/cancel-by-token", cancelBookingByToken);

// All user booking operations requiring session auth
router.post("/", requireAuth, createBooking);
router.post("/verify-payment", requireAuth, verifyPayment);
router.get("/my", requireAuth, getUserBookings);
router.post("/:id/cancel", requireAuth, cancelBooking);

export default router;
