import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import seedRoutes from "./routes/seedRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import { processExpiredOffers } from "./services/waitlistService.js";
import { errorHandler } from "./middleware/errorHandler.js";

import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy for Render / cloud load balancers (required for HTTPS, secure cookies, correct client IPs)
app.set("trust proxy", 1);

// Connect to MongoDB Atlas
connectDB();

// Parse allowed origins from FRONTEND_URL and CLIENT_URL (supports comma-separated URLs)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
]
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

// CORS configuration supporting single or multiple frontend URLs
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Next.js server rewrites, Render health checks)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.some((a) => cleanOrigin.startsWith(a))
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-token",
      "x-admin-token",
      "x-portal",
    ],
  })
);

app.use(cookieParser());
app.use(express.json());

// Request logger for development
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check status helper with database state
const getHealthStatus = () => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    status: "ok",
    service: "EventFlow Express API",
    port: Number(PORT),
    database: dbStatusMap[dbState] || "unknown",
    timestamp: new Date().toISOString(),
  };
};

// Health check endpoints
app.get("/api/health", (req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get("/health", (req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "EventFlow Express API",
    status: "running",
    healthCheck: "/api/health",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seed", seedRoutes);

// Central error handler
app.use(errorHandler);

// Background worker: Process expired waitlist offers every 60 seconds
const WAITLIST_EXPIRY_INTERVAL_MS = 60 * 1000;
setInterval(() => {
  processExpiredOffers().catch((err) => {
    console.error("Waitlist periodic worker error:", err.message);
  });
}, WAITLIST_EXPIRY_INTERVAL_MS);

// Start listening (0.0.0.0 binds across all network interfaces on Render)
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 [Backend] Gather API Server listening on port ${PORT}`);
  console.log(`🌐 [Backend] Allowing requests from: ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "*"}`);
  console.log(`⏱️  [Backend] Waitlist expiration worker running every ${WAITLIST_EXPIRY_INTERVAL_MS / 1000}s`);
  console.log(`🩺 [Backend] Health check available at: /api/health`);
});

// KeepAlive configuration to prevent socket hangup/ECONNRESET behind reverse proxies and Next.js rewrites
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;   // 66 seconds

export default app;

