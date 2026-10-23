import { Router } from "express";
import {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  googleAuth,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/logout", logout);
router.get("/me", getMe);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
