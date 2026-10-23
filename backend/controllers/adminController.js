import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Waitlist from "../models/Waitlist.js";
import { isDbConnected, inMemoryBookings, inMemoryEvents, inMemoryUsers } from "../utils/memoryStore.js";

/**
 * Get comprehensive admin dashboard statistics
 */
export async function getDashboardStats(req, res) {
  try {
    if (isDbConnected()) {
      const [totalEvents, totalConfirmedBookings, totalUsers, allBookings, totalWaitlist, categoryAgg] = await Promise.all([
        Event.countDocuments(),
        Booking.countDocuments({ bookingStatus: "confirmed" }),
        User.countDocuments(),
        Booking.find({ bookingStatus: "confirmed", paymentStatus: "completed" }).lean(),
        Waitlist.countDocuments({ status: { $in: ["WAITING", "OFFERED"] } }),
        Event.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      const categoryCounts = {};
      (categoryAgg || []).forEach((c) => {
        if (c._id) categoryCounts[c._id] = c.count;
      });

      const totalCollectedRevenue = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

      const recentBookings = await Booking.find()
        .populate("event", "title date venue price")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      return res.status(200).json({
        stats: {
          totalEvents,
          totalConfirmedBookings,
          totalUsers,
          totalCollectedRevenue,
          totalWaitlist,
          categoryCounts,
        },
        recentBookings,
      });
    }

    // In-memory stats
    const totalEvents = inMemoryEvents.length;
    const totalConfirmedBookings = inMemoryBookings.filter((b) => b.bookingStatus === "confirmed").length;
    const totalUsers = inMemoryUsers.length;
    const totalCollectedRevenue = inMemoryBookings
      .filter((b) => b.bookingStatus === "confirmed" && b.paymentStatus === "completed")
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const categoryCounts = {};
    inMemoryEvents.forEach((e) => {
      if (e.category) {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      }
    });

    const recentBookings = inMemoryBookings.slice(0, 8);

    return res.status(200).json({
      stats: {
        totalEvents,
        totalConfirmedBookings,
        totalUsers,
        totalCollectedRevenue,
        categoryCounts,
      },
      recentBookings,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ error: "Failed to calculate admin dashboard metrics." });
  }
}

/**
 * Get all attendees / registrations table
 */
export async function getAllBookings(req, res) {
  try {
    const { status, search, eventId } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status && status !== "all") {
        filter.bookingStatus = status;
      }
      if (eventId && eventId !== "all") {
        filter.event = eventId;
      }

      if (search && search.trim()) {
        const term = search.trim();
        filter.$or = [
          { bookingRef: { $regex: term, $options: "i" } },
          { attendeeName: { $regex: term, $options: "i" } },
          { attendeeEmail: { $regex: term, $options: "i" } },
        ];
      }

      const bookings = await Booking.find(filter)
        .populate("event", "title date time venue")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ bookings: bookings || [] });
    }

    // In-memory bookings
    let filtered = [...inMemoryBookings];
    if (status && status !== "all") {
      filtered = filtered.filter((b) => b.bookingStatus === status);
    }
    if (eventId && eventId !== "all") {
      filtered = filtered.filter((b) => {
        const bEventId = (b.event?._id || b.event)?.toString();
        return bEventId === eventId;
      });
    }
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bookingRef.toLowerCase().includes(term) ||
          (b.attendeeName && b.attendeeName.toLowerCase().includes(term)) ||
          (b.attendeeEmail && b.attendeeEmail.toLowerCase().includes(term))
      );
    }

    return res.status(200).json({ bookings: filtered });
  } catch (error) {
    console.error("getAllBookings error:", error);
    return res.status(500).json({ error: "Failed to retrieve attendee registrations." });
  }
}

/**
 * Get all payments table with breakdown
 */
export async function getAllPayments(req, res) {
  try {
    const { status } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status && status !== "all") {
        filter.paymentStatus = status;
      }

      const payments = await Booking.find(filter)
        .populate("event", "title price")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();

      let successfulRevenue = 0;
      let pendingRevenue = 0;
      let successfulCount = 0;
      let freeCount = 0;

      payments.forEach((p) => {
        if (p.paymentStatus === "completed" && p.bookingStatus === "confirmed") {
          successfulRevenue += p.amount || 0;
          successfulCount++;
        } else if (p.paymentStatus === "pending") {
          pendingRevenue += p.amount || 0;
        } else if (p.paymentStatus === "free") {
          freeCount++;
        }
      });

      return res.status(200).json({
        summary: {
          successfulRevenue,
          pendingRevenue,
          successfulCount,
          freeCount,
          totalTransactions: payments.length,
        },
        payments: payments || [],
      });
    }

    // In-memory payments
    let payments = [...inMemoryBookings];
    if (status && status !== "all") {
      payments = payments.filter((p) => p.paymentStatus === status);
    }

    let successfulRevenue = 0;
    let pendingRevenue = 0;
    let successfulCount = 0;
    let freeCount = 0;

    payments.forEach((p) => {
      if (p.paymentStatus === "completed" && p.bookingStatus === "confirmed") {
        successfulRevenue += p.amount || 0;
        successfulCount++;
      } else if (p.paymentStatus === "pending") {
        pendingRevenue += p.amount || 0;
      } else if (p.paymentStatus === "free") {
        freeCount++;
      }
    });

    return res.status(200).json({
      summary: {
        successfulRevenue,
        pendingRevenue,
        successfulCount,
        freeCount,
        totalTransactions: payments.length,
      },
      payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    return res.status(500).json({ error: "Failed to retrieve payment records." });
  }
}

/**
 * List all events for admin management (including unlisted/draft)
 */
export async function getAdminEvents(req, res) {
  try {
    if (isDbConnected()) {
      const events = await Event.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ events: events || [] });
    }

    return res.status(200).json({ events: inMemoryEvents });
  } catch (error) {
    console.error("getAdminEvents error:", error);
    return res.status(500).json({ error: "Failed to fetch events for admin." });
  }
}

/**
 * List all registered users for admin management
 */
export async function getAllUsers(req, res) {
  try {
    if (isDbConnected()) {
      const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
      return res.status(200).json({ users: users || [] });
    }

    const safeUsers = inMemoryUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({ users: safeUsers });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ error: "Failed to fetch registered users." });
  }
}

export default { getDashboardStats, getAllBookings, getAllPayments, getAdminEvents, getAllUsers };
