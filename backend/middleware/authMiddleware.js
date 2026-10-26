import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const isAdminRoute =
      req.originalUrl?.includes("/admin") ||
      req.baseUrl?.includes("/admin") ||
      req.path?.includes("/admin") ||
      (req.baseUrl?.includes("/events") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) ||
      (req.originalUrl?.includes("/events") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method));

    const candidateTokens = [];

    // Header tokens
    const headerAdminToken = req.headers?.["x-admin-token"];
    const headerUserToken = req.headers?.["x-user-token"];
    let bearerToken = null;
    if (req.headers?.authorization && req.headers.authorization.startsWith("Bearer ")) {
      bearerToken = req.headers.authorization.split(" ")[1];
    }

    // Cookie tokens
    const cookieAdminToken = req.cookies?.admintoken;
    const cookieUserToken = req.cookies?.usertoken;
    const cookieAuthToken = req.cookies?.auth_token;

    if (isAdminRoute) {
      if (headerAdminToken) candidateTokens.push(headerAdminToken);
      if (cookieAdminToken) candidateTokens.push(cookieAdminToken);
      if (bearerToken) candidateTokens.push(bearerToken);
      if (headerUserToken) candidateTokens.push(headerUserToken);
      if (cookieUserToken) candidateTokens.push(cookieUserToken);
      if (cookieAuthToken) candidateTokens.push(cookieAuthToken);
    } else {
      if (headerUserToken) candidateTokens.push(headerUserToken);
      if (cookieUserToken) candidateTokens.push(cookieUserToken);
      if (bearerToken) candidateTokens.push(bearerToken);
      if (headerAdminToken) candidateTokens.push(headerAdminToken);
      if (cookieAdminToken) candidateTokens.push(cookieAdminToken);
      if (cookieAuthToken) candidateTokens.push(cookieAuthToken);
    }

    const uniqueTokens = [...new Set(candidateTokens.filter((t) => typeof t === "string" && t.trim().length > 0))];

    if (uniqueTokens.length === 0) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    let validDecoded = null;
    let validToken = null;

    for (const cand of uniqueTokens) {
      const decoded = verifyToken(cand);
      if (decoded) {
        if (isAdminRoute && decoded.role === "admin") {
          validDecoded = decoded;
          validToken = cand;
          break;
        } else if (!validDecoded) {
          validDecoded = decoded;
          validToken = cand;
        }
      }
    }

    if (!validDecoded) {
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }

    req.user = validDecoded;
    req.token = validToken;
    req.tokenType = validDecoded.role === "admin" ? "admintoken" : "usertoken";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Internal authentication error" });
  }
}

export default requireAuth;
