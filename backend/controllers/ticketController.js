import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import {
  issueTicketsForBooking,
  generateTicketQrDataUrl,
  verifyTicketStatus,
  confirmTicketCheckIn,
} from "../services/ticketService.js";

/**
 * Get all tickets for the currently logged-in user
 */
export async function getMyTickets(req, res) {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;
    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const matchConditions = [];
    if (userId) matchConditions.push({ user: userId });
    if (userEmail) matchConditions.push({ attendeeEmail: userEmail });

    const tickets = await Ticket.find({ $or: matchConditions })
      .populate("event")
      .populate("booking")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ tickets: tickets || [] });
  } catch (err) {
    console.error("getMyTickets error:", err);
    return res.status(500).json({ error: "Failed to load your passes" });
  }
}

/**
 * Get tickets for a specific booking owned by current user (or admin)
 * Automatically issues them if booking is eligible and tickets don't exist yet.
 */
export async function getBookingTickets(req, res) {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;
    const { bookingId } = req.params;

    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const booking = await Booking.findById(bookingId).populate("event");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Permission check: User must own booking (by ID or attendee email), or be an admin
    const isOwner =
      (userId && booking.user && booking.user.toString() === userId.toString()) ||
      (userEmail && booking.attendeeEmail && booking.attendeeEmail.toLowerCase() === userEmail);

    if (!isOwner && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access to this booking's passes" });
    }

    // Issue tickets if eligible and not yet created
    if (
      booking.bookingStatus === "confirmed" &&
      (booking.amount === 0 || booking.paymentStatus === "completed")
    ) {
      await issueTicketsForBooking(booking._id);
    }

    const tickets = await Ticket.find({ booking: booking._id })
      .populate("event")
      .populate("booking")
      .sort({ seatNumber: 1 })
      .lean();

    // Attach QR code data URL to each ticket
    const ticketsWithQr = await Promise.all(
      tickets.map(async (t) => {
        let qrDataUrl = null;
        if (t.status !== "cancelled") {
          try {
            qrDataUrl = await generateTicketQrDataUrl(t.ticketCode);
          } catch {
            qrDataUrl = null;
          }
        }
        return {
          ...t,
          qrDataUrl,
        };
      })
    );

    return res.status(200).json({
      booking: {
        id: booking._id,
        bookingRef: booking.bookingRef,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        seatsBooked: booking.seatsBooked,
        amount: booking.amount,
      },
      tickets: ticketsWithQr,
    });
  } catch (err) {
    console.error("getBookingTickets error:", err);
    return res.status(500).json({ error: "Failed to retrieve tickets for booking" });
  }
}

/**
 * Get single ticket details with QR code by ticket ID or code
 */
export async function getTicketById(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let ticket = await Ticket.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketCode: id.trim().toUpperCase() }],
    })
      .populate("event")
      .populate("booking")
      .lean();

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Permission: Owner or Admin
    if (ticket.user.toString() !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied to this pass." });
    }

    let qrDataUrl = null;
    if (ticket.status !== "cancelled") {
      qrDataUrl = await generateTicketQrDataUrl(ticket.ticketCode);
    }

    return res.status(200).json({
      ticket: {
        ...ticket,
        qrDataUrl,
      },
    });
  } catch (err) {
    console.error("getTicketById error:", err);
    return res.status(500).json({ error: "Failed to retrieve ticket" });
  }
}

/**
 * ADMIN: Verify a scanned or manually entered ticket code / reference
 */
export async function adminVerifyTicket(req, res) {
  try {
    const { query, eventId } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Scanned code or reference is required" });
    }

    const verification = await verifyTicketStatus({
      rawQuery: query.trim(),
      expectedEventId: eventId || null,
    });

    return res.status(200).json(verification);
  } catch (err) {
    console.error("adminVerifyTicket error:", err);
    return res.status(500).json({ error: "Ticket verification process error" });
  }
}

/**
 * ADMIN: Confirm check-in for a verified ticket
 */
export async function adminConfirmCheckIn(req, res) {
  try {
    const adminUserId = req.user?.id;
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    const checkInResult = await confirmTicketCheckIn({
      ticketId,
      adminUserId,
    });

    if (!checkInResult.success) {
      return res.status(400).json(checkInResult);
    }

    return res.status(200).json(checkInResult);
  } catch (err) {
    console.error("adminConfirmCheckIn error:", err);
    return res.status(500).json({ error: "Failed to confirm check-in" });
  }
}

export default {
  getMyTickets,
  getBookingTickets,
  getTicketById,
  adminVerifyTicket,
  adminConfirmCheckIn,
};
