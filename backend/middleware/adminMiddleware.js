import User from "../models/User.js";
import { isDbConnected, inMemoryUsers } from "../utils/memoryStore.js";

export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // 1. Direct match on token
  if (req.user.role === "admin") {
    return next();
  }

  // 2. Fallback: check live database role (for users promoted in database while token is still active)
  try {
    if (isDbConnected()) {
      const dbUser = await User.findById(req.user.id).select("role email").lean();
      if (dbUser && dbUser.role === "admin" && dbUser.email === "admin@gmail.com") {
        req.user.role = "admin";
        return next();
      }
    } else {
      const memUser = inMemoryUsers.find((u) => u._id === req.user.id || u.email === req.user.email);
      if (memUser && memUser.role === "admin" && memUser.email === "admin@gmail.com") {
        req.user.role = "admin";
        return next();
      }
    }
  } catch {
    // continue to denial
  }

  if (req.user.email === "admin@gmail.com" && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Access denied. Only admin@gmail.com has administrator privileges." });
}

export default requireAdmin;
