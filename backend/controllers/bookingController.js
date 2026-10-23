import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import jwt from "jsonwebtoken";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/paymentService.js";
import { sendBookingConfirmation, sendBookingCancellation } from "../services/emailService.js";
import { issueTicketsForBooking, invalidateTicketsForBooking, generateTicketQrDataUrl } from "../services/ticketService.js";
import { allocateSeatIfWaitlistExists } from "../services/waitlistService.js";
import { isDbConnected, inMemoryBookings, inMemoryEvents } from "../utils/memoryStore.js";

function generateBookingRef() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EF-${timestamp}-${random}`;
}

/**
 * Create a new Booking
 * Handles both Free Events (direct confirmation) and Paid Events (Razorpay order creation)
 */
export async function createBooking(req, res) {
  try {
    const userId = req.user?.id;
    const { eventId, seatsBooked = 1, attendeeName, attendeeEmail } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required to book an event." });
    }

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required." });
    }

    const seats = parseInt(seatsBooked, 10);
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ error: "Must book at least 1 seat." });
    }

    if (!attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: "Attendee name and email are required." });
    }

    if (isDbConnected()) {
      // 1. Fetch Event
      const event = await Event.findById(eventId);
      if (!event || !event.isPublished) {
        return res.status(404).json({ error: "Event not found or is no longer accepting registrations." });
      }

      // 2. Check seat capacity
      if (event.availableSeats < seats) {
        return res.status(400).json({
          error: `Insufficient seats available. Only ${event.availableSeats} seat(s) remaining.`,
          availableSeats: event.availableSeats,
        });
      }

      // 3. Prevent duplicate active booking by the same user for the same event
      const existingActiveBooking = await Booking.findOne({
        user: userId,
        event: event._id,
        bookingStatus: "confirmed",
      });

      if (existingActiveBooking) {
        return res.status(409).json({
          error: `You already hold an active confirmed booking for this event (Ref: ${existingActiveBooking.bookingRef}).`,
          bookingRef: existingActiveBooking.bookingRef,
          bookingId: existingActiveBooking._id,
          booking: existingActiveBooking,
        });
      }

      const bookingRef = generateBookingRef();
      const isFree = event.price === 0;

      // --- CASE A: FREE EVENT ---
      if (isFree) {
        // Concurrency-safe atomic seat decrement
        const updatedEvent = await Event.findOneAndUpdate(
          { _id: event._id, availableSeats: { $gte: seats } },
          { $inc: { availableSeats: -seats } },
          { new: true }
        );

        if (!updatedEvent) {
          return res.status(400).json({
            error: "Seat capacity was just filled by another attendee. Please try again.",
          });
        }

        const booking = await Booking.create({
          bookingRef,
          user: userId,
          event: event._id,
          seatsBooked: seats,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim().toLowerCase(),
          amount: 0,
          currency: "INR",
          bookingStatus: "confirmed",
          paymentStatus: "free",
          confirmedAt: new Date(),
        });

        // Issue unique admission tickets for confirmed free booking
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
          console.error("Failed to issue tickets for free booking:", tErr);
        }

        // Send confirmation email asynchronously with QR ticket and cancellation link
        sendBookingConfirmation({
          toEmail: attendeeEmail.trim().toLowerCase(),
          attendeeName: attendeeName.trim(),
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          venue: event.venue,
          seatsBooked: seats,
          bookingRef,
          bookingId: booking._id,
          cancellationSecret: booking.cancellationSecret,
          amount: 0,
          isFree: true,
          paymentStatus: "free",
          ticketCode: firstTicketCode,
          tickets: issuedTickets,
        }).catch((err) => console.error("Email dispatch failed:", err));

        return res.status(201).json({
          message: "Free registration confirmed successfully!",
          isFree: true,
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
              time: event.time,
              venue: event.venue,
            },
          },
        });
      }

      // --- CASE B: PAID EVENT ---
      const totalAmount = event.price * seats;

      let razorpayOrder;
      try {
        razorpayOrder = await createRazorpayOrder({
          amount: totalAmount,
          currency: "INR",
          receipt: bookingRef,
          notes: {
            eventId: event._id.toString(),
            userId,
            eventTitle: event.title,
          },
        });
      } catch (paymentErr) {
        return res.status(503).json({
          error: paymentErr?.error?.description || paymentErr?.description || paymentErr?.message || "Payment gateway unavailable. Please check Razorpay configuration.",
          setupRequired: true,
        });
      }

      const pendingBooking = await Booking.create({
        bookingRef,
        user: userId,
        event: event._id,
        seatsBooked: seats,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim().toLowerCase(),
        amount: totalAmount,
        currency: "INR",
        bookingStatus: "pending",
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
      });

      return res.status(201).json({
        message: "Order created. Proceed to payment.",
        isFree: false,
        bookingId: pendingBooking._id,
        bookingRef: pendingBooking.bookingRef,
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
          seats,
        },
      });
    }

    // --- IN-MEMORY FALLBACK ---
    const event = inMemoryEvents.find((e) => e._id === eventId || e.slug === eventId);
    if (!event || event.isPublished === false) {
      return res.status(404).json({ error: "Event not found or is no longer accepting registrations." });
    }

    if (event.availableSeats < seats) {
      return res.status(400).json({
        error: `Insufficient seats available. Only ${event.availableSeats} seat(s) remaining.`,
        availableSeats: event.availableSeats,
      });
    }

    const existingActiveBooking = inMemoryBookings.find(
      (b) =>
        b.user === userId &&
        (b.event?._id === event._id || b.event === event._id || b.event?.slug === event.slug) &&
        b.bookingStatus === "confirmed"
    );

    if (existingActiveBooking) {
      return res.status(409).json({
        error: `You already hold an active confirmed booking for this event (Ref: ${existingActiveBooking.bookingRef}).`,
        bookingRef: existingActiveBooking.bookingRef,
        bookingId: existingActiveBooking._id,
        booking: existingActiveBooking,
      });
    }

    const bookingRef = generateBookingRef();
    const isFree = event.price === 0;

    if (isFree) {
      event.availableSeats -= seats;

      const booking = {
        _id: Date.now().toString(16).padStart(24, "0"),
        bookingRef,
        user: userId,
        event: {
          _id: event._id,
          title: event.title,
          slug: event.slug,
          date: event.date,
          time: event.time,
          venue: event.venue,
          price: event.price,
          image: event.image,
        },
        seatsBooked: seats,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim().toLowerCase(),
        amount: 0,
        currency: "INR",
        bookingStatus: "confirmed",
        paymentStatus: "free",
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      };

      inMemoryBookings.unshift(booking);

      sendBookingConfirmation({
        toEmail: attendeeEmail.trim().toLowerCase(),
        attendeeName: attendeeName.trim(),
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        venue: event.venue,
        seatsBooked: seats,
        bookingRef,
        bookingId: booking._id,
        cancellationSecret: booking.bookingRef,
        amount: 0,
        isFree: true,
        paymentStatus: "free",
        ticketCode: bookingRef,
      }).catch((err) => console.error("Email dispatch failed:", err));

      return res.status(201).json({
        message: "Free registration confirmed successfully! (In-Memory Session)",
        isFree: true,
        booking: {
          id: booking._id,
          bookingRef: booking.bookingRef,
          seatsBooked: booking.seatsBooked,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          event: {
            title: event.title,
            date: event.date,
            time: event.time,
            venue: event.venue,
          },
        },
      });
    }

    const totalAmount = event.price * seats;
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: totalAmount,
        currency: "INR",
        receipt: bookingRef,
        notes: {
          eventId: event._id,
          userId,
          eventTitle: event.title,
        },
      });
    } catch (paymentErr) {
      return res.status(503).json({
        error: paymentErr?.error?.description || paymentErr?.description || paymentErr?.message || "Payment gateway unavailable. Please check Razorpay configuration.",
        setupRequired: true,
      });
    }

    const pendingBooking = {
      _id: Date.now().toString(16).padStart(24, "0"),
      bookingRef,
      user: userId,
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        price: event.price,
      },
      seatsBooked: seats,
      attendeeName: attendeeName.trim(),
      attendeeEmail: attendeeEmail.trim().toLowerCase(),
      amount: totalAmount,
      currency: "INR",
      bookingStatus: "pending",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
      createdAt: new Date().toISOString(),
    };

    inMemoryBookings.unshift(pendingBooking);

    return res.status(201).json({
      message: "Order created. Proceed to payment.",
      isFree: false,
      bookingId: pendingBooking._id,
      bookingRef: pendingBooking.bookingRef,
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
        seats,
      },
    });
  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({ error: error.message || "Failed to process booking request" });
  }
}

/**
 * Verify Razorpay payment and confirm booking
 */
export async function verifyPayment(req, res) {
  try {
    const userId = req.user?.id;
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Missing required payment verification details." });
    }

    if (isDbConnected()) {
      const booking = await Booking.findById(bookingId).populate("event");
      if (!booking) {
        return res.status(404).json({ error: "Booking record not found." });
      }

      const bookingUserId = (booking.user?._id || booking.user || "").toString();
      if (bookingUserId && userId && bookingUserId !== userId.toString() && req.user?.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized access to this booking." });
      }

      if (booking.bookingStatus === "confirmed" && booking.paymentStatus === "completed") {
        return res.status(200).json({
          message: "Payment already verified and booking confirmed.",
          booking,
        });
      }

      const isValidSignature = verifyRazorpaySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValidSignature) {
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(400).json({ error: "Invalid payment signature verification failed." });
      }

      const seatsToDeduct = booking.seatsBooked;
      const targetEventId = booking.event?._id || booking.event;
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: targetEventId, availableSeats: { $gte: seatsToDeduct } },
        { $inc: { availableSeats: -seatsToDeduct } },
        { new: true }
      );

      if (!updatedEvent) {
        booking.paymentStatus = "completed";
        booking.bookingStatus = "cancelled";
        await booking.save();
        return res.status(409).json({
          error: "Payment succeeded but seats became unavailable before checkout completed. Support will issue an immediate refund.",
        });
      }

      booking.bookingStatus = "confirmed";
      booking.paymentStatus = "completed";
      booking.razorpayPaymentId = razorpayPaymentId;
      booking.razorpaySignature = razorpaySignature;
      booking.confirmedAt = new Date();
      await booking.save();

      // Issue unique admission tickets for confirmed paid booking
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
        console.error("Failed to issue tickets for paid booking:", tErr);
      }

      const eventTitle = booking.event?.title || updatedEvent?.title || "Gather Masterclass";
      const eventDate = booking.event?.date || updatedEvent?.date || "Scheduled Date";
      const eventTime = booking.event?.time || updatedEvent?.time || "Scheduled Time";
      const eventVenue = booking.event?.venue || updatedEvent?.venue || "Fort Kochi Studio";

      sendBookingConfirmation({
        toEmail: booking.attendeeEmail,
        attendeeName: booking.attendeeName,
        eventTitle,
        eventDate,
        eventTime,
        venue: eventVenue,
        seatsBooked: booking.seatsBooked,
        bookingRef: booking.bookingRef,
        bookingId: booking._id,
        cancellationSecret: booking.cancellationSecret,
        amount: booking.amount,
        isFree: false,
        paymentStatus: "completed",
        ticketCode: firstTicketCode,
        tickets: issuedTickets,
      }).catch((err) => console.error("Email dispatch failed:", err));

      return res.status(200).json({
        message: "Payment verified successfully! Your booking is confirmed.",
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
            title: eventTitle,
            date: eventDate,
            venue: eventVenue,
          },
        },
      });
    }

    // In-memory verification
    const booking = inMemoryBookings.find((b) => b._id === bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking record not found." });
    }

    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      booking.paymentStatus = "failed";
      return res.status(400).json({ error: "Invalid payment signature verification failed." });
    }

    const event = inMemoryEvents.find((e) => e._id === (booking.event?._id || booking.event));
    if (event) {
      event.availableSeats -= booking.seatsBooked;
    }

    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "completed";
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    booking.confirmedAt = new Date().toISOString();

    return res.status(200).json({
      message: "Payment verified successfully! Your booking is confirmed.",
      booking: {
        id: booking._id,
        bookingRef: booking.bookingRef,
        seatsBooked: booking.seatsBooked,
        amount: booking.amount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        razorpayPaymentId: booking.razorpayPaymentId,
        event: {
          title: booking.event?.title || event?.title,
          date: booking.event?.date || event?.date,
          venue: booking.event?.venue || event?.venue,
        },
      },
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ error: error.message || "Payment verification failed" });
  }
}

/**
 * Get all bookings for the currently authenticated user
 */
export async function getUserBookings(req, res) {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;
    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (isDbConnected()) {
      const matchConditions = [];
      if (userId) matchConditions.push({ user: userId });
      if (userEmail) matchConditions.push({ attendeeEmail: userEmail });

      const bookings = await Booking.find({ $or: matchConditions })
        .populate("event")
        .sort({ createdAt: -1 })
        .lean();

      // Retrieve all tickets issued for these bookings
      const bookingIds = (bookings || []).map((b) => b._id);
      const tickets = await Ticket.find({ booking: { $in: bookingIds } }).lean();

      const enrichedBookings = (bookings || []).map((b) => {
        const bTickets = tickets.filter((t) => t.booking.toString() === b._id.toString());
        const isEligible =
          b.bookingStatus === "confirmed" &&
          (b.amount === 0 || b.paymentStatus === "completed");

        return {
          ...b,
          ticketsCount: bTickets.length,
          hasValidTicket: bTickets.some((t) => t.status === "valid" || t.status === "checked_in"),
          isEligibleForTicket: isEligible,
          ticketSummary: bTickets.length > 0 ? bTickets[0] : null,
        };
      });

      return res.status(200).json({ bookings: enrichedBookings });
    }

    // In-memory user bookings
    const bookings = inMemoryBookings.filter((b) => b.user === userId);
    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("getUserBookings error:", error);
    return res.status(500).json({ error: "Failed to retrieve your bookings" });
  }
}

/**
 * Helper to validate cancellation authorization
 */
function validateCancellationAuth(booking, token) {
  if (!token) return false;
  // 1. Exact match with cancellationSecret
  if (booking.cancellationSecret && booking.cancellationSecret === token) {
    return true;
  }
  // 2. Direct match with bookingRef
  if (booking.bookingRef && booking.bookingRef.toUpperCase() === token.toUpperCase()) {
    return true;
  }
  // 3. JWT verification fallback
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    if (decoded && (decoded.bookingId === booking._id.toString() || decoded.ref === booking.bookingRef)) {
      return true;
    }
  } catch {
    // ignore jwt error
  }
  return false;
}

/**
 * Retrieve booking cancellation preview info via secure token (no login required)
 */
export async function getCancelInfo(req, res) {
  try {
    const { id, token, ref } = req.query;
    if (!id && !ref) {
      return res.status(400).json({ error: "Booking reference or ID is required" });
    }

    let booking = null;
    if (isDbConnected()) {
      const query = id ? { _id: id } : { bookingRef: (ref || "").trim().toUpperCase() };
      booking = await Booking.findOne(query).populate("event");
    } else {
      booking = inMemoryBookings.find(
        (b) => (id && b._id === id) || (ref && b.bookingRef === (ref || "").trim().toUpperCase())
      );
    }

    if (!booking) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    const isValidToken = validateCancellationAuth(booking, token);
    if (!isValidToken) {
      return res.status(403).json({ error: "Invalid or expired cancellation authorization token." });
    }

    const event = booking.event || {};
    return res.status(200).json({
      bookingId: booking._id,
      bookingRef: booking.bookingRef,
      attendeeName: booking.attendeeName,
      attendeeEmail: booking.attendeeEmail,
      seatsBooked: booking.seatsBooked,
      bookingStatus: booking.bookingStatus,
      amount: booking.amount,
      isFree: booking.amount === 0 || booking.paymentStatus === "free",
      event: {
        title: event.title || "Gather Session",
        date: event.date || "Scheduled Date",
        time: event.time || "",
        venue: event.venue || "",
        image: event.image || "",
      },
    });
  } catch (error) {
    console.error("getCancelInfo error:", error);
    return res.status(500).json({ error: "Failed to load cancellation information" });
  }
}

/**
 * Cancel a booking via secure token from email (no login required)
 */
export async function cancelBookingByToken(req, res) {
  try {
    const { bookingId, token, ref } = req.body;
    if (!bookingId && !ref) {
      return res.status(400).json({ error: "Missing booking ID or reference" });
    }

    if (isDbConnected()) {
      const query = bookingId ? { _id: bookingId } : { bookingRef: (ref || "").trim().toUpperCase() };
      const booking = await Booking.findOne(query).populate("event");
      if (!booking) {
        return res.status(404).json({ error: "Reservation not found." });
      }

      const isValidToken = validateCancellationAuth(booking, token);
      if (!isValidToken) {
        return res.status(403).json({ error: "Invalid or expired cancellation authorization token." });
      }

      if (booking.bookingStatus === "cancelled") {
        return res.status(400).json({ error: "This reservation is already cancelled." });
      }

      const eventId = booking.event?._id || booking.event;
      await Event.findByIdAndUpdate(eventId, {
        $inc: { availableSeats: booking.seatsBooked },
      });

      booking.bookingStatus = "cancelled";
      await booking.save();

      // Invalidate all associated admission tickets
      try {
        await invalidateTicketsForBooking(booking._id);
      } catch (tErr) {
        console.error("Failed to invalidate tickets for cancelled booking:", tErr);
      }

      // Automatically offer available seat(s) to earliest waitlisted attendees if any exist
      try {
        const seatsFreed = booking.seatsBooked || 1;
        for (let i = 0; i < seatsFreed; i++) {
          await allocateSeatIfWaitlistExists(eventId);
        }
      } catch (wErr) {
        console.error("Failed to allocate cancelled seats to waitlist:", wErr);
      }

      // Send cancellation confirmation email
      sendBookingCancellation({
        toEmail: booking.attendeeEmail,
        attendeeName: booking.attendeeName,
        eventTitle: booking.event?.title || "Gather Session",
        eventDate: booking.event?.date || "",
        bookingRef: booking.bookingRef,
        seatsBooked: booking.seatsBooked,
        amount: booking.amount,
        isFree: booking.amount === 0 || booking.paymentStatus === "free",
      }).catch((err) => console.error("Email dispatch failed:", err));

      return res.status(200).json({
        message: "Your reservation has been cancelled successfully. A confirmation email has been sent.",
        bookingRef: booking.bookingRef,
      });
    }

    // In-memory mode
    const booking = inMemoryBookings.find(
      (b) => (bookingId && b._id === bookingId) || (ref && b.bookingRef === (ref || "").trim().toUpperCase())
    );
    if (!booking) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ error: "This reservation is already cancelled." });
    }

    booking.bookingStatus = "cancelled";
    const event = inMemoryEvents.find((e) => e._id === (booking.event?._id || booking.event));
    if (event) {
      event.availableSeats += booking.seatsBooked;
    }

    sendBookingCancellation({
      toEmail: booking.attendeeEmail,
      attendeeName: booking.attendeeName,
      eventTitle: booking.event?.title || event?.title || "Gather Session",
      eventDate: booking.event?.date || event?.date || "",
      bookingRef: booking.bookingRef,
      seatsBooked: booking.seatsBooked,
      amount: booking.amount,
      isFree: booking.amount === 0 || booking.paymentStatus === "free",
    }).catch((err) => console.error("Email dispatch failed:", err));

    return res.status(200).json({
      message: "Your reservation has been cancelled successfully. A confirmation email has been sent.",
      bookingRef: booking.bookingRef,
    });
  } catch (error) {
    console.error("cancelBookingByToken error:", error);
    return res.status(500).json({ error: "Failed to cancel reservation." });
  }
}

/**
 * Cancel a booking (authenticated via account dashboard)
 */
export async function cancelBooking(req, res) {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;
    const { id } = req.params;

    if (isDbConnected()) {
      const matchConditions = [];
      if (userId) matchConditions.push({ user: userId });
      if (userEmail) matchConditions.push({ attendeeEmail: userEmail });

      const booking = await Booking.findOne({
        _id: id,
        ...(matchConditions.length > 0 ? { $or: matchConditions } : {}),
      }).populate("event");
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.bookingStatus === "cancelled") {
        return res.status(400).json({ error: "This booking is already cancelled." });
      }

      const eventId = booking.event?._id || booking.event;
      await Event.findByIdAndUpdate(eventId, {
        $inc: { availableSeats: booking.seatsBooked },
      });

      booking.bookingStatus = "cancelled";
      await booking.save();

      // Invalidate all associated admission tickets
      try {
        await invalidateTicketsForBooking(booking._id);
      } catch (tErr) {
        console.error("Failed to invalidate tickets for cancelled booking:", tErr);
      }

      // Automatically offer available seat(s) to earliest waitlisted attendees if any exist
      try {
        const seatsFreed = booking.seatsBooked || 1;
        for (let i = 0; i < seatsFreed; i++) {
          await allocateSeatIfWaitlistExists(eventId);
        }
      } catch (wErr) {
        console.error("Failed to allocate cancelled seats to waitlist:", wErr);
      }

      // Send cancellation confirmation email
      sendBookingCancellation({
        toEmail: booking.attendeeEmail,
        attendeeName: booking.attendeeName,
        eventTitle: booking.event?.title || "Gather Session",
        eventDate: booking.event?.date || "",
        bookingRef: booking.bookingRef,
        seatsBooked: booking.seatsBooked,
        amount: booking.amount,
        isFree: booking.amount === 0 || booking.paymentStatus === "free",
      }).catch((err) => console.error("Email dispatch failed:", err));

      return res.status(200).json({ message: "Booking cancelled successfully. Seats have been restored." });
    }

    // In-memory cancel booking
    const booking = inMemoryBookings.find((b) => b._id === id && b.user === userId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ error: "This booking is already cancelled." });
    }

    booking.bookingStatus = "cancelled";
    const event = inMemoryEvents.find((e) => e._id === (booking.event?._id || booking.event));
    if (event) {
      event.availableSeats += booking.seatsBooked;
    }

    sendBookingCancellation({
      toEmail: booking.attendeeEmail,
      attendeeName: booking.attendeeName,
      eventTitle: booking.event?.title || event?.title || "Gather Session",
      eventDate: booking.event?.date || event?.date || "",
      bookingRef: booking.bookingRef,
      seatsBooked: booking.seatsBooked,
      amount: booking.amount,
      isFree: booking.amount === 0 || booking.paymentStatus === "free",
    }).catch((err) => console.error("Email dispatch failed:", err));

    return res.status(200).json({ message: "Booking cancelled successfully. Seats have been restored." });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
}

export default {
  createBooking,
  verifyPayment,
  getUserBookings,
  cancelBooking,
  getCancelInfo,
  cancelBookingByToken,
};
