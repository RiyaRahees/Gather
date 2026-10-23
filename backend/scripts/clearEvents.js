import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function clearEvents() {
  console.log("🧹 Connecting to MongoDB to delete events...");
  const conn = await connectDB();
  if (!conn) {
    console.error("❌ Could not connect to MongoDB Atlas.");
    process.exit(1);
  }

  try {
    const eventCountBefore = await Event.countDocuments();
    console.log(`Found ${eventCountBefore} events in the database.`);

    const deletedEvents = await Event.deleteMany({});
    console.log(`✅ Successfully deleted ${deletedEvents.deletedCount} events from MongoDB.`);

    const bookingCountBefore = await Booking.countDocuments();
    console.log(`Found ${bookingCountBefore} bookings in the database.`);
    const deletedBookings = await Booking.deleteMany({});
    console.log(`✅ Successfully deleted ${deletedBookings.deletedCount} associated bookings from MongoDB.`);

    const remainingEvents = await Event.countDocuments();
    console.log(`🎉 Events remaining in database: ${remainingEvents}`);
  } catch (err) {
    console.error("❌ Error deleting events:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

clearEvents();
