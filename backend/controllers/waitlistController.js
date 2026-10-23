import Waitlist from "../models/Waitlist.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import {
  joinWaitlist as joinWaitlistService,
  leaveWaitlist as leaveWaitlistService,
  adminRemoveWaitlistEntry,
  adminPromoteWaitlistEntry,
  getUserWaitlistEntries,
  getEventWaitlistSummary as getEventSummaryService,
} from "../services/waitlistService.js";
import { issueTicketsForBooking, generateTicketQrDataUrl } from "../services/ticketService.js";
import { sendBookingConfirmation } from "../services/emailService.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/paymentService.js";

function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WL-${part1}-${part2}`;
}

/**
 * Join event waitlist
 */
export async function joinWaitlist(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to join the waitlist." });
    }

    const { eventId, attendeeName, attendeeEmail } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required." });
    }

    const user = await User.findById(userId);
    const finalName = (attendeeName || user?.name || "Attendee").trim();
    const finalEmail = (attendeeEmail || user?.email || "").trim().toLowerCase();

    if (!finalEmail) {
      return res.status(400).json({ error: "Attendee email is required." });
    }

    const result = await joinWaitlistService({
      eventId,
      userId,
      attendeeName: finalName,
      attendeeEmail: finalEmail,
    });

    return res.status(201).json({
      message: "You have been added to the waitlist. You will be notified immediately if a seat opens.",
      waitlist: result.waitlistEntry,
      activeCount: result.activeCount,
      queuePosition: result.queuePosition,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Failed to join waitlist",
      isFull: error.isFull || false,
      existingWaitlist: error.existingWaitlist || null,
    });
  }
}

/**
 * Get current authenticated user's waitlist entries
 */
export async function getMyWaitlist(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const entries = await getUserWaitlistEntries(userId);
    return res.status(200).json({ waitlist: entries });
  } catch (error) {
    console.error("getMyWaitlist error:", error);
    return res.status(500).json({ error: "Failed to retrieve your waitlist entries." });
  }
}

/**
 * Get waitlist status summary for a specific event
 */
export async function getEventWaitlist(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id || req.user?._id || null;
    const userEmail = req.user?.email || null;

    const summary = await getEventSummaryService(eventId, userId, userEmail);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("getEventWaitlist error:", error);
    return res.status(500).json({ error: "Failed to load waitlist summary." });
  }
}

/**
 * User voluntarily leaves the waitlist
 */
export async function leaveWaitlist(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const result = await leaveWaitlistService({
      waitlistId: id,
      userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || "Failed to leave waitlist." });
  }
}

/**
 * Claim an offered seat for a Free event
 */
export async function claimFreeOffer(req, res) {
  try {
    const userId = req.user?.id;
    const { waitlistId, offerToken } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const waitlist = await Waitlist.findOne({
      _id: waitlistId,
      user: userId,
      status: "OFFERED",
    }).populate("event");

    if (!waitlist) {
      return res.status(404).json({ error: "Active offered waitlist pass not found." });
    }

    if (waitlist.offerExpiresAt && new Date(waitlist.offerExpiresAt) < new Date()) {
      return res.status(410).json({ error: "This seat offer has expired." });
    }

    if (offerToken && waitlist.offerToken && waitlist.offerToken !== offerToken) {
      return res.status(403).json({ error: "Invalid offer security token." });
    }

    const event = waitlist.event;
    if (event.price > 0) {
      return res.status(400).json({ error: "This is a paid event. Payment checkout is required." });
    }

    const bookingRef = generateBookingRef();
    const booking = await Booking.create({
      bookingRef,
      user: userId,
      event: event._id,
      seatsBooked: 1,
      attendeeName: waitlist.attendeeName,
      attendeeEmail: waitlist.attendeeEmail,
      amount: 0,
      currency: "INR",
      bookingStatus: "confirmed",
      paymentStatus: "free",
      confirmedAt: new Date(),
    });

    // Mark waitlist as confirmed
    waitlist.status = "CONFIRMED";
    waitlist.claimedBooking = booking._id;
    waitlist.offerToken = null;
    await waitlist.save();

    // Issue digital tickets
    let firstTicketCode = null;
    let firstTicketQr = null;
    let issuedTickets = [];
    try {
      const ticketRes = await issueTicketsForBooking(booking._id);
      issuedTickets = ticketRes?.tickets || [];
      firstTicketCode = issuedTickets[0]?.ticketCode || null;
      if (firstTicketCode) {
        firstTicketQr = await generateTicketQrDataUrl(firstTicketCode);
      }
    } catch (tErr) {
      console.error("Waitlist ticket issuance failed:", tErr);
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation({
        toEmail: waitlist.attendeeEmail,
        attendeeName: waitlist.attendeeName,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.venue,
        seatsBooked: 1,
        bookingRef,
        bookingId: booking._id,
        cancellationSecret: booking.cancellationSecret,
        amount: 0,
        isFree: true,
        paymentStatus: "free",
        ticketCode: firstTicketCode,
        tickets: issuedTickets,
      });
    } catch (emailErr) {
      console.error("Waitlist booking confirmation email failed:", emailErr);
    }

    return res.status(200).json({
      message: "Waitlist seat successfully claimed!",
      booking: {
        id: booking._id,
        _id: booking._id,
        bookingRef: booking.bookingRef,
        seatsBooked: booking.seatsBooked,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        ticketCode: firstTicketCode,
        qrDataUrl: firstTicketQr,
        event: {
          title: event.title,
          date: event.date,
          venue: event.venue,
        },
      },
    });
  } catch (error) {
    console.error("claimFreeOffer error:", error);
    return res.status(500).json({ error: error.message || "Failed to claim offered seat." });
  }
}

/**
 * Initiate Razorpay checkout for claiming a paid event offer
 */
export async function initiatePaidOfferClaim(req, res) {
  try {
    const userId = req.user?.id;
    const { waitlistId, offerToken } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const waitlist = await Waitlist.findOne({
      _id: waitlistId,
      user: userId,
      status: "OFFERED",
    }).populate("event");

    if (!waitlist) {
      return res.status(404).json({ error: "Active offered waitlist pass not found." });
    }

    if (waitlist.offerExpiresAt && new Date(waitlist.offerExpiresAt) < new Date()) {
      return res.status(410).json({ error: "This seat offer has expired." });
    }

    if (offerToken && waitlist.offerToken && waitlist.offerToken !== offerToken) {
      return res.status(403).json({ error: "Invalid offer security token." });
    }

    const event = waitlist.event;
    if (event.price <= 0) {
      return res.status(400).json({ error: "This is a free event. Use free claim instead." });
    }

    const bookingRef = generateBookingRef();
    const razorpayOrder = await createRazorpayOrder({
      amount: event.price,
      currency: "INR",
      receipt: bookingRef,
      notes: {
        waitlistId: waitlist._id.toString(),
        eventId: event._id.toString(),
        userId,
        eventTitle: event.title,
      },
    });

    // Create a pending booking record
    const booking = await Booking.create({
      bookingRef,
      user: userId,
      event: event._id,
      seatsBooked: 1,
      attendeeName: waitlist.attendeeName,
      attendeeEmail: waitlist.attendeeEmail,
      amount: event.price,
      currency: "INR",
      bookingStatus: "pending",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(200).json({
      bookingId: booking._id,
      bookingRef: booking.bookingRef,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: razorpayOrder.isSimulated ? null : process.env.RAZORPAY_KEY_ID,
        isSimulated: Boolean(razorpayOrder.isSimulated),
      },
      event: {
        title: event.title,
        price: event.price,
        seats: 1,
      },
    });
  } catch (error) {
    console.error("initiatePaidOfferClaim error:", error);
    return res.status(500).json({ error: error.message || "Failed to initiate payment." });
  }
}

/**
 * Verify Razorpay payment and confirm waitlist claim
 */
export async function verifyPaidOfferClaim(req, res) {
  try {
    const userId = req.user?.id;
    const { waitlistId, bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!waitlistId || !bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Missing required payment verification details." });
    }

    const waitlist = await Waitlist.findOne({
      _id: waitlistId,
      user: userId,
      status: "OFFERED",
    });

    if (!waitlist) {
      return res.status(404).json({ error: "Waitlist offer record not found or already processed." });
    }

    const booking = await Booking.findById(bookingId).populate("event");
    if (!booking) {
      return res.status(404).json({ error: "Booking record not found." });
    }

    // Verify cryptographic signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    }

    // Confirm booking
    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "completed";
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    booking.confirmedAt = new Date();
    await booking.save();

    // Confirm waitlist
    waitlist.status = "CONFIRMED";
    waitlist.claimedBooking = booking._id;
    waitlist.offerToken = null;
    await waitlist.save();

    // Issue ticket
    let firstTicketCode = null;
    let firstTicketQr = null;
    let issuedTickets = [];
    try {
      const ticketRes = await issueTicketsForBooking(booking._id);
      issuedTickets = ticketRes?.tickets || [];
      firstTicketCode = issuedTickets[0]?.ticketCode || null;
      if (firstTicketCode) {
        firstTicketQr = await generateTicketQrDataUrl(firstTicketCode);
      }
    } catch (tErr) {
      console.error("Waitlist ticket issuance failed:", tErr);
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation({
        toEmail: booking.attendeeEmail,
        attendeeName: booking.attendeeName,
        eventTitle: booking.event?.title || "Gather Masterclass",
        eventDate: booking.event?.date || "Scheduled Date",
        eventTime: booking.event?.time || "Scheduled Time",
        venue: booking.event?.venue || "Fort Kochi Studio",
        seatsBooked: 1,
        bookingRef: booking.bookingRef,
        bookingId: booking._id,
        cancellationSecret: booking.cancellationSecret,
        amount: booking.amount,
        isFree: false,
        paymentStatus: "completed",
        ticketCode: firstTicketCode,
        tickets: issuedTickets,
      });
    } catch (emailErr) {
      console.error("Waitlist paid booking confirmation email failed:", emailErr);
    }

    return res.status(200).json({
      message: "Waitlist seat confirmed and payment verified successfully!",
      booking: {
        id: booking._id,
        _id: booking._id,
        bookingRef: booking.bookingRef,
        seatsBooked: booking.seatsBooked,
        amount: booking.amount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        razorpayPaymentId: booking.razorpayPaymentId,
        ticketCode: firstTicketCode,
        qrDataUrl: firstTicketQr,
        event: {
          title: booking.event?.title || "Gather Masterclass",
          date: booking.event?.date || "Scheduled Date",
          venue: booking.event?.venue || "Fort Kochi Studio",
        },
      },
    });
  } catch (error) {
    console.error("verifyPaidOfferClaim error:", error);
    return res.status(500).json({ error: error.message || "Failed to verify waitlist payment." });
  }
}

/**
 * Admin: Get all waitlist entries with optional filter by eventId or status
 */
export async function getAdminWaitlist(req, res) {
  try {
    const { eventId, status } = req.query;
    const query = {};

    if (eventId) {
      query.event = eventId;
    }
    if (status) {
      query.status = status;
    }

    const entries = await Waitlist.find(query)
      .populate("event", "title date time venue price isPublished")
      .populate("user", "name email")
      .populate("claimedBooking", "bookingRef amount bookingStatus paymentStatus")
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalWaiting: await Waitlist.countDocuments({ status: "WAITING" }),
      totalOffered: await Waitlist.countDocuments({ status: "OFFERED" }),
      totalConfirmed: await Waitlist.countDocuments({ status: "CONFIRMED" }),
      totalCancelled: await Waitlist.countDocuments({ status: "CANCELLED" }),
      totalExpired: await Waitlist.countDocuments({ status: "EXPIRED" }),
    };

    return res.status(200).json({ entries, stats });
  } catch (error) {
    console.error("getAdminWaitlist error:", error);
    return res.status(500).json({ error: "Failed to retrieve waitlist management entries." });
  }
}

/**
 * Admin: Remove a waitlist entry
 */
export async function adminRemove(req, res) {
  try {
    const { id } = req.params;
    const result = await adminRemoveWaitlistEntry(id);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || "Failed to remove waitlist entry." });
  }
}

/**
 * Admin: Promote a waiting entry to OFFERED status and send email notification with payment option
 */
export async function adminPromote(req, res) {
  try {
    const { id } = req.params;
    const result = await adminPromoteWaitlistEntry(id);
    return res.status(200).json({
      message: "Waitlist attendee promoted to offered status. Notification email sent.",
      entry: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || "Failed to promote waitlist entry." });
  }
}

export default {
  joinWaitlist,
  getMyWaitlist,
  getEventWaitlist,
  leaveWaitlist,
  claimFreeOffer,
  initiatePaidOfferClaim,
  verifyPaidOfferClaim,
  getAdminWaitlist,
  adminRemove,
  adminPromote,
};
