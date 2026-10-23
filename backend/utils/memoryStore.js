import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Password hashes precomputed or generated for demonstration accounts
const ADMIN_HASH = bcrypt.hashSync("admin123", 10);
const USER_HASH = bcrypt.hashSync("RiyaPass2026!", 10);

export function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export const inMemoryUsers = [
  {
    _id: "6ad9b3755c66b2907372d4d4",
    name: "Admin",
    email: "admin@gmail.com",
    passwordHash: ADMIN_HASH,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

export const inMemoryEvents = [];

export const inMemoryBookings = [];
