import { Router } from "express";
import { seedDatabase } from "../controllers/seedController.js";

const router = Router();

// Endpoint for seeding database
router.get("/", seedDatabase);
router.post("/", seedDatabase);

export default router;
