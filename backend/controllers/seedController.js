import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { hashPassword } from "../utils/password.js";

export const INITIAL_DEMO_EVENTS = [];

export async function seedDatabase(req, res) {
  try {
    // 1. Ensure Admin User
    let admin = await User.findOne({ email: "admin@gmail.com" });
    if (!admin) {
      const passwordHash = await hashPassword("admin123");
      admin = await User.create({
        name: "Gather Administrator",
        email: "admin@gmail.com",
        passwordHash,
        role: "admin",
      });
      console.log("✓ Admin user created: admin@gmail.com");
    }


    // 3. Seed Events idempotently
    let eventsCreated = 0;
    for (const item of INITIAL_DEMO_EVENTS) {
      const existing = await Event.findOne({ slug: item.slug });
      if (!existing) {
        await Event.create({
          ...item,
          createdBy: admin._id,
        });
        eventsCreated++;
      }
    }

    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();

    const responsePayload = {
      message: "Database seed operation completed successfully",
      eventsCreated,
      totalEvents,
      totalUsers,
      adminCredentials: {
        email: "admin@gmail.com",
        password: "admin123",
      },
      userCredentials: {
        email: "riya@gather.dev",
        password: "RiyaPass2026!",
      },
    };

    if (res) {
      return res.status(200).json(responsePayload);
    }
    return responsePayload;
  } catch (error) {
    console.error("Seed error:", error);
    if (res) {
      return res.status(500).json({ error: error.message || "Failed to seed database" });
    }
    throw error;
  }
}

export default { seedDatabase, INITIAL_DEMO_EVENTS };
