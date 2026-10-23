import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { seedDatabase } from "../controllers/seedController.js";
import mongoose from "mongoose";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  console.log("🌱 Starting Gather Database Seed...");
  const conn = await connectDB();
  if (!conn) {
    console.error("❌ Cannot seed: MongoDB Atlas connection could not be established.");
    console.error("👉 Please verify MONGODB_URI and IP access whitelist in MongoDB Atlas.");
    process.exit(1);
  }

  try {
    const result = await seedDatabase();
    console.log("✨ Seed Finished!");
    console.log(`- New Events Added: ${result.eventsCreated}`);
    console.log(`- Total Events in DB: ${result.totalEvents}`);
    console.log(`- Total Users in DB: ${result.totalUsers}`);
    console.log(`- Admin Login: ${result.adminCredentials.email} / ${result.adminCredentials.password}`);
    console.log(`- User Login: ${result.userCredentials.email} / ${result.userCredentials.password}`);
  } catch (err) {
    console.error("❌ Seed failed with error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
