import { Router } from "express";
import {
  submitProposal,
  getAdminProposals,
  updateProposalStatus,
  deleteProposal,
} from "../controllers/proposalController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// Public / User endpoint to submit proposal
router.post("/", submitProposal);

// Admin-only endpoints
router.get("/admin", requireAuth, requireAdmin, getAdminProposals);
router.patch("/admin/:id/status", requireAuth, requireAdmin, updateProposalStatus);
router.delete("/admin/:id", requireAuth, requireAdmin, deleteProposal);

export default router;
