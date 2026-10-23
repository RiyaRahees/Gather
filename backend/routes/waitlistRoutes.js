import { Router } from "express";
import {
  joinWaitlist,
  getMyWaitlist,
  getEventWaitlist,
  leaveWaitlist,
  claimFreeOffer,
  initiatePaidOfferClaim,
  verifyPaidOfferClaim,
  getAdminWaitlist,
  adminRemove,
  adminPromote,
} from "../controllers/waitlistController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { verifyToken } from "../utils/jwt.js";

const router = Router();

// Optional auth helper for event summary
function optionalAuth(req, res, next) {
  try {
    let token = null;
    if (req.headers && (req.headers["x-user-token"] || req.headers["x-admin-token"])) {
      token = req.headers["x-user-token"] || req.headers["x-admin-token"];
    } else if (req.headers && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies) {
      token = req.cookies.usertoken || req.cookies.auth_token || req.cookies.admintoken;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
  } catch {
    // continue unauthenticated
  }
  next();
}

// User-facing endpoints
router.post("/join", requireAuth, joinWaitlist);
router.get("/my", requireAuth, getMyWaitlist);
router.get("/event/:eventId", optionalAuth, getEventWaitlist);
router.post("/:id/leave", requireAuth, leaveWaitlist);
router.post("/claim/free", requireAuth, claimFreeOffer);
router.post("/claim/initiate-paid", requireAuth, initiatePaidOfferClaim);
router.post("/claim/verify-paid", requireAuth, verifyPaidOfferClaim);

// Admin-facing endpoints
router.get("/admin", requireAuth, requireAdmin, getAdminWaitlist);
router.delete("/admin/:id", requireAuth, requireAdmin, adminRemove);
router.post("/admin/:id/promote", requireAuth, requireAdmin, adminPromote);

export default router;
