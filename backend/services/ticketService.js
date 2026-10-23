import crypto from "crypto";
import QRCode from "qrcode";
import Ticket from "../models/Ticket.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

/**
 * Generate a cryptographically secure, unpredictable ticket identifier.
 * Format: GF-XXXX-XXXX-XXXX (e.g. GF-E4A9-72B1-C890)
 */
export function generateTicketCode() {
  const bytes = crypto.randomBytes(6);
  const hex = bytes.toString("hex").toUpperCase();
  return `GF-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/**
 * Compute SHA-256 hash of a ticket token
 */
export function hashTicketToken(token) {
  return crypto.createHash("sha256").update(token.trim().toUpperCase()).digest("hex");
}

/**
 * Issue tickets for a booking if eligible and not already issued.
 * Prevents duplicate ticket issuance.
 */
export async function issueTicketsForBooking(bookingId) {
  const booking = await Booking.findById(bookingId).populate("event");
  if (!booking) {
    throw new Error("Booking not found");
  }

  // 1. Admission eligibility check:
  // Must be confirmed. If paid, paymentStatus must be completed.
  if (booking.bookingStatus !== "confirmed") {
    return { success: false, reason: "BOOKING_NOT_CONFIRMED", tickets: [] };
  }

  if (booking.amount > 0 && booking.paymentStatus !== "completed") {
    return { success: false, reason: "PAYMENT_NOT_COMPLETED", tickets: [] };
  }

  // 2. Prevent duplicate issuance: Check if tickets already exist
  const existingTickets = await Ticket.find({ booking: booking._id })
    .populate("event")
    .sort({ seatNumber: 1 });

  if (existingTickets.length > 0) {
    return { success: true, reason: "ALREADY_ISSUED", tickets: existingTickets };
  }

  // 3. Issue a unique ticket for each seat in the booking
  const seatsCount = Math.max(1, parseInt(booking.seatsBooked, 10) || 1);
  const createdTickets = [];

  for (let seat = 1; seat <= seatsCount; seat++) {
    // Generate unique code with collision safeguard
    let uniqueCode = "";
    let collision = true;
    while (collision) {
      uniqueCode = generateTicketCode();
      const exists = await Ticket.findOne({ ticketCode: uniqueCode });
      if (!exists) collision = false;
    }

    const tokenHash = hashTicketToken(uniqueCode);

    const ticket = await Ticket.create({
      ticketCode: uniqueCode,
      tokenHash,
      booking: booking._id,
      event: booking.event._id || booking.event,
      user: booking.user,
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      seatNumber: seat,
      totalSeats: seatsCount,
      status: "valid",
      issuedAt: new Date(),
    });

    createdTickets.push(ticket);
  }

  return { success: true, reason: "ISSUED", tickets: createdTickets };
}

/**
 * Invalidate all tickets belonging to a booking (e.g. upon cancellation)
 */
export async function invalidateTicketsForBooking(bookingId) {
  const result = await Ticket.updateMany(
    { booking: bookingId, status: { $ne: "cancelled" } },
    { $set: { status: "cancelled" } }
  );
  return result;
}

/**
 * Generate a QR Code Data URL for rendering in web client or emails
 * Encodes ONLY the pure ticketCode (no personal info, no secrets).
 */
export async function generateTicketQrDataUrl(ticketCode) {
  try {
    return await QRCode.toDataURL(ticketCode.trim().toUpperCase(), {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 2,
      width: 280,
      color: {
        dark: "#073F2E",
        light: "#FFFEFA",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR data URL:", err);
    throw err;
  }
}

/**
 * Generate a PNG Buffer for Nodemailer inline CID attachment
 */
export async function generateTicketQrBuffer(ticketCode) {
  try {
    return await QRCode.toBuffer(ticketCode.trim().toUpperCase(), {
      errorCorrectionLevel: "H",
      type: "png",
      margin: 2,
      width: 320,
      color: {
        dark: "#073F2E",
        light: "#FFFEFA",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR buffer:", err);
    throw err;
  }
}

/**
 * Verify a ticket's status and admission readiness
 */
export async function verifyTicketStatus({ rawQuery, expectedEventId = null }) {
  const cleaned = (rawQuery || "").trim().toUpperCase();
  if (!cleaned) {
    return { valid: false, code: "EMPTY_QUERY", message: "Ticket code or reference is required" };
  }

  // Look up by ticketCode or by bookingRef
  let ticket = await Ticket.findOne({ ticketCode: cleaned })
    .populate("event")
    .populate("booking");

  if (!ticket) {
    // Check if user entered booking reference (e.g. EF-XXXX)
    const booking = await Booking.findOne({ bookingRef: cleaned }).populate("event");
    if (booking) {
      ticket = await Ticket.findOne({ booking: booking._id, status: "valid" })
        .populate("event")
        .populate("booking");
      
      if (!ticket) {
        // Find any ticket on this booking to report exact status
        ticket = await Ticket.findOne({ booking: booking._id })
          .populate("event")
          .populate("booking");
      }
    }
  }

  if (!ticket) {
    return {
      valid: false,
      code: "INVALID_TICKET",
      message: "No ticket found matching the scanned code or reference.",
    };
  }

  const booking = ticket.booking;
  const event = ticket.event;

  // 1. Check if booking was cancelled
  if (booking && booking.bookingStatus === "cancelled") {
    return {
      valid: false,
      code: "BOOKING_CANCELLED",
      message: "The reservation associated with this ticket was cancelled.",
      ticket,
      event,
    };
  }

  // 2. Check if ticket itself was cancelled
  if (ticket.status === "cancelled") {
    return {
      valid: false,
      code: "TICKET_CANCELLED",
      message: "This admission pass has been voided or cancelled.",
      ticket,
      event,
    };
  }

  // 3. Check payment status if paid event
  if (booking && booking.amount > 0 && booking.paymentStatus !== "completed") {
    return {
      valid: false,
      code: "PAYMENT_NOT_VERIFIED",
      message: `Payment status is ${booking.paymentStatus}. Ticket is not cleared for admission.`,
      ticket,
      event,
    };
  }

  // 4. Check if already checked in
  if (ticket.status === "checked_in") {
    return {
      valid: false,
      code: "ALREADY_CHECKED_IN",
      message: `Already checked in on ${new Date(ticket.checkedInAt).toLocaleTimeString()} (${new Date(ticket.checkedInAt).toLocaleDateString()}). Duplicate admission denied.`,
      ticket,
      event,
      checkedInAt: ticket.checkedInAt,
    };
  }

  // 5. Check event mismatch if admin is filtering for a specific event
  if (expectedEventId && event && event._id.toString() !== expectedEventId.toString()) {
    return {
      valid: false,
      code: "EVENT_MISMATCH",
      message: `Ticket is for "${event.title}", not the selected event.`,
      ticket,
      event,
    };
  }

  // All checks passed! Ready for admission check-in
  return {
    valid: true,
    code: "READY_FOR_CHECKIN",
    message: "Valid pass. Ready for admission check-in.",
    ticket,
    event,
  };
}

/**
 * Concurrency-safe atomic check-in confirmation
 */
export async function confirmTicketCheckIn({ ticketId, adminUserId }) {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  // Atomic findOneAndUpdate with status: "valid"
  // Guarantees race-condition prevention across simultaneous scans
  const updatedTicket = await Ticket.findOneAndUpdate(
    { _id: ticketId, status: "valid" },
    {
      $set: {
        status: "checked_in",
        checkedInAt: new Date(),
        checkedInBy: adminUserId,
      },
    },
    { new: true }
  )
    .populate("event")
    .populate("booking");

  if (!updatedTicket) {
    // Check why it failed
    const checkCurrent = await Ticket.findById(ticketId);
    if (!checkCurrent) {
      return { success: false, code: "NOT_FOUND", message: "Ticket record no longer exists." };
    }
    if (checkCurrent.status === "checked_in") {
      return {
        success: false,
        code: "ALREADY_CHECKED_IN",
        message: "Ticket was already checked in seconds ago. Duplicate admission prevented.",
        ticket: checkCurrent,
      };
    }
    return {
      success: false,
      code: "CANNOT_CHECKIN",
      message: `Cannot check in ticket with status: ${checkCurrent.status}`,
      ticket: checkCurrent,
    };
  }

  return {
    success: true,
    code: "CHECKED_IN_SUCCESSFULLY",
    message: "Attendee admitted successfully!",
    ticket: updatedTicket,
  };
}

export default {
  generateTicketCode,
  hashTicketToken,
  issueTicketsForBooking,
  invalidateTicketsForBooking,
  generateTicketQrDataUrl,
  generateTicketQrBuffer,
  verifyTicketStatus,
  confirmTicketCheckIn,
};
