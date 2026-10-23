import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    const isAdminRoute =
      req.originalUrl?.includes("/admin") ||
      req.baseUrl?.includes("/admin") ||
      req.path?.includes("/admin");

    // 1. Check HTTP headers first (allows frontend to explicitly specify usertoken vs admintoken)
    if (req.headers) {
      if (isAdminRoute) {
        token = req.headers["x-admin-token"] || req.headers["x-user-token"];
      } else {
        token = req.headers["x-user-token"] || req.headers["x-admin-token"];
      }

      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }
    }

    // 2. Check cookies
    if (!token && req.cookies) {
      if (isAdminRoute) {
        token = req.cookies.admintoken || req.cookies.auth_token || req.cookies.usertoken;
      } else {
        token = req.cookies.usertoken || req.cookies.auth_token || req.cookies.admintoken;
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }

    req.user = decoded;
    req.token = token;
    req.tokenType = decoded.role === "admin" ? "admintoken" : "usertoken";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal authentication error" });
  }
}

export default requireAuth;
