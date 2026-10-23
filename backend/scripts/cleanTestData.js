import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import Waitlist from "../models/Waitlist.js";
import Event from "../models/Event.js";
import { hashPassword } from "../utils/password.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function cleanData() {
  console.log("🧹 Starting database cleanup: Removing users, attendees, and payments...");
  const conn = await connectDB();
  if (!conn) {
    console.error("❌ Cannot connect to MongoDB Atlas.");
    process.exit(1);
  }

  try {
    // 1. Ensure Admin Account is preserved with verified credentials
    let admin = await User.findOne({ email: "admin@gmail.com" });
    if (!admin) {
      const passwordHash = await hashPassword("admin123");
      admin = await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        passwordHash,
        role: "admin",
      });
      console.log("✓ Created Admin user: admin@gmail.com / admin123");
    } else {
      admin.role = "admin";
      admin.name = "Admin";
      await admin.save();
      console.log("✓ Preserved Admin user: admin@gmail.com (role: admin)");
    }

    // 2. Remove all non-admin users
    const deleteUsersResult = await User.deleteMany({ email: { $ne: "admin@gmail.com" } });
    console.log(`✓ Removed ${deleteUsersResult.deletedCount} non-admin users.`);

    // 3. Remove all bookings / attendees / payments
    const deleteBookingsResult = await Booking.deleteMany({});
    console.log(`✓ Removed ${deleteBookingsResult.deletedCount} booking and payment records.`);

    // 4. Remove all tickets
    const deleteTicketsResult = await Ticket.deleteMany({});
    console.log(`✓ Removed ${deleteTicketsResult.deletedCount} digital tickets.`);

    // 5. Remove all waitlists
    const deleteWaitlistResult = await Waitlist.deleteMany({});
    console.log(`✓ Removed ${deleteWaitlistResult.deletedCount} waitlist queue entries.`);

    // 6. Reset available seats on all events
    const events = await Event.find({});
    for (const evt of events) {
      evt.availableSeats = evt.totalSeats || 50;
      evt.createdBy = admin._id;
      await evt.save();
    }
    console.log(`✓ Reset seat availability on all ${events.length} events.`);

    // 7. Verify final states
    const finalUserCount = await User.countDocuments();
    const finalBookingCount = await Booking.countDocuments();
    const finalTicketCount = await Ticket.countDocuments();
    const finalWaitlistCount = await Waitlist.countDocuments();
    const remainingUsers = await User.find({}, "name email role");

    console.log("\n📊 Verification Summary:");
    console.log(`- Total Users: ${finalUserCount} (only ${remainingUsers.map(u => u.email).join(", ")})`);
    console.log(`- Total Attendees / Bookings: ${finalBookingCount}`);
    console.log(`- Total Payment Transactions: ${finalBookingCount}`);
    console.log(`- Total Tickets: ${finalTicketCount}`);
    console.log(`- Total Waitlist: ${finalWaitlistCount}`);
    console.log("✨ All attendees, payments, and users successfully removed!");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

cleanData();
