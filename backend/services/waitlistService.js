import crypto from "crypto";
import Waitlist from "../models/Waitlist.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendWaitlistJoinedEmail, sendWaitlistOfferEmail } from "./emailService.js";

const MAX_WAITLIST_CAPACITY = 10;
const OFFER_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Get active count of waitlisted users for an event (WAITING + OFFERED)
 */
export async function getActiveWaitlistCount(eventId) {
  return await Waitlist.countDocuments({
    event: eventId,
    status: { $in: ["WAITING", "OFFERED"] },
  });
}

/**
 * Join event waitlist
 */
export async function joinWaitlist({ eventId, userId, attendeeName, attendeeEmail }) {
  const event = await Event.findById(eventId);
  if (!event || !event.isPublished) {
    const error = new Error("Event not found or no longer active.");
    error.statusCode = 404;
    throw error;
  }

  // Check if event is actually sold out
  if (event.availableSeats > 0) {
    const error = new Error("Seats are still available for this event. You can register directly without joining the waitlist.");
    error.statusCode = 400;
    throw error;
  }

  // Check if user already has an active confirmed booking for this event
  const existingBooking = await Booking.findOne({
    user: userId,
    event: eventId,
    bookingStatus: "confirmed",
  });
  if (existingBooking) {
    const error = new Error(`You already have a confirmed booking (Ref: ${existingBooking.bookingRef}) for this event.`);
    error.statusCode = 409;
    throw error;
  }

  // Check if user already has an active waitlist entry for this event
  const existingWaitlist = await Waitlist.findOne({
    event: eventId,
    user: userId,
    status: { $in: ["WAITING", "OFFERED"] },
  });
  if (existingWaitlist) {
    const error = new Error(
      existingWaitlist.status === "OFFERED"
        ? "A seat is currently offered to you! Please check your bookings to claim it."
        : "You are already on the waitlist for this event."
    );
    error.statusCode = 409;
    error.existingWaitlist = existingWaitlist;
    throw error;
  }

  // Check waitlist capacity (Max 10 active entries)
  const activeCount = await getActiveWaitlistCount(eventId);
  if (activeCount >= MAX_WAITLIST_CAPACITY) {
    const error = new Error("The waitlist for this event is currently full (maximum 10 attendees). Please check back later.");
    error.statusCode = 400;
    error.isFull = true;
    throw error;
  }

  // Calculate dynamic queue position
  const activeWaitingCount = await Waitlist.countDocuments({
    event: eventId,
    status: "WAITING",
  });

  const queuePosition = activeWaitingCount + 1;

  const waitlistEntry = await Waitlist.create({
    event: eventId,
    user: userId,
    attendeeName: attendeeName.trim(),
    attendeeEmail: attendeeEmail.trim().toLowerCase(),
    status: "WAITING",
    queuePosition,
    joinedAt: new Date(),
  });

  // Send waitlist confirmation email to attendee asynchronously
  sendWaitlistJoinedEmail({
    toEmail: waitlistEntry.attendeeEmail,
    attendeeName: waitlistEntry.attendeeName,
    eventTitle: event.title,
    eventDate: event.date,
    eventTime: event.time,
    venue: event.venue,
    price: event.price,
    queuePosition,
    eventSlug: event.slug,
    eventId: event._id.toString(),
  }).catch((err) => {
    console.error("Failed to send waitlist confirmation email:", err.message);
  });

  return {
    waitlistEntry,
    activeCount: activeCount + 1,
    queuePosition,
  };
}

/**
 * Promote the earliest eligible WAITING attendee when a seat becomes available
 */
export async function allocateSeatIfWaitlistExists(eventId) {
  // 1. Verify seat availability atomically on the event
  // We atomically decrement 1 seat to hold it exclusively for the offered waitlist user
  const event = await Event.findOneAndUpdate(
    { _id: eventId, availableSeats: { $gt: 0 } },
    { $inc: { availableSeats: -1 } },
    { new: true }
  );

  if (!event) {
    // No seats currently available to allocate
    return null;
  }

  // 2. Find the earliest waiting entry (FIFO order)
  const earliestEntry = await Waitlist.findOne({
    event: eventId,
    status: "WAITING",
  }).sort({ joinedAt: 1 });

  if (!earliestEntry) {
    // No waitlisted users found; restore the held seat back to public availableSeats
    await Event.findByIdAndUpdate(eventId, { $inc: { availableSeats: 1 } });
    return null;
  }

  // 3. Generate secure crypto offer token
  const offerToken = crypto.randomBytes(32).toString("hex");
  const offerExpiresAt = new Date(Date.now() + OFFER_DURATION_MS);

  earliestEntry.status = "OFFERED";
  earliestEntry.offeredAt = new Date();
  earliestEntry.offerExpiresAt = offerExpiresAt;
  earliestEntry.offerToken = offerToken;
  await earliestEntry.save();

  // 4. Send email notification asynchronously with direct claim & payment options
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const claimUrl = `${frontendUrl}/events/${event.slug || eventId}?claimWaitlist=${offerToken}`;

  sendWaitlistOfferEmail({
    toEmail: earliestEntry.attendeeEmail,
    attendeeName: earliestEntry.attendeeName,
    eventTitle: event.title,
    eventDate: event.date,
    eventTime: event.time,
    venue: event.venue,
    price: event.price,
    offerExpiresAt,
    claimUrl,
  }).catch((err) => {
    console.error("Failed to send waitlist offer email:", err.message);
  });

  console.log(`🎟️  [Waitlist Promotion] Offered 1 seat for "${event.title}" to ${earliestEntry.attendeeEmail}. Expires in 2 hours.`);
  return earliestEntry;
}

/**
 * Periodically process expired offers and pass seat to the next waiting user
 */
export async function processExpiredOffers() {
  try {
    const now = new Date();
    const expiredEntries = await Waitlist.find({
      status: "OFFERED",
      offerExpiresAt: { $lt: now },
    });

    if (expiredEntries.length === 0) {
      return 0;
    }

    console.log(`⏱️  [Waitlist Worker] Found ${expiredEntries.length} expired waitlist offer(s). Reallocating...`);

    for (const entry of expiredEntries) {
      entry.status = "EXPIRED";
      entry.offerToken = null;
      await entry.save();

      // Return the held seat back to the event
      await Event.findByIdAndUpdate(entry.event, { $inc: { availableSeats: 1 } });

      // Immediately offer the freed seat to the next person waiting
      await allocateSeatIfWaitlistExists(entry.event);
    }

    return expiredEntries.length;
  } catch (err) {
    console.error("Error processing expired waitlist offers:", err);
    return 0;
  }
}

/**
 * Allow an authenticated user to leave the waitlist
 */
export async function leaveWaitlist({ waitlistId, userId }) {
  const entry = await Waitlist.findOne({
    _id: waitlistId,
    user: userId,
    status: { $in: ["WAITING", "OFFERED"] },
  });

  if (!entry) {
    const error = new Error("Active waitlist entry not found.");
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = entry.status;
  entry.status = "CANCELLED";
  entry.offerToken = null;
  await entry.save();

  // If the user cancelled while an offer was holding a seat, restore the seat and promote next in line
  if (previousStatus === "OFFERED") {
    await Event.findByIdAndUpdate(entry.event, { $inc: { availableSeats: 1 } });
    await allocateSeatIfWaitlistExists(entry.event);
  }

  return { message: "Successfully left the waitlist." };
}

/**
 * Admin removes an entry from the waitlist
 */
export async function adminRemoveWaitlistEntry(waitlistId) {
  const entry = await Waitlist.findById(waitlistId);
  if (!entry) {
    const error = new Error("Waitlist entry not found.");
    error.statusCode = 404;
    throw error;
  }

  const previousStatus = entry.status;
  entry.status = "REMOVED";
  entry.offerToken = null;
  await entry.save();

  // If entry was in OFFERED status holding a seat, return seat and offer to next
  if (previousStatus === "OFFERED") {
    await Event.findByIdAndUpdate(entry.event, { $inc: { availableSeats: 1 } });
    await allocateSeatIfWaitlistExists(entry.event);
  }

  return { message: "Waitlist entry removed by administrator." };
}

/**
 * Retrieve user's waitlist entries with dynamic queue position & offer countdown
 */
export async function getUserWaitlistEntries(userId) {
  const entries = await Waitlist.find({ user: userId })
    .populate("event")
    .sort({ createdAt: -1 })
    .lean();

  const enriched = await Promise.all(
    entries.map(async (entry) => {
      let dynamicPosition = null;
      let isOfferActive = false;
      let secondsRemaining = 0;

      if (entry.status === "WAITING") {
        // Count entries in front of this entry
        const aheadCount = await Waitlist.countDocuments({
          event: entry.event?._id,
          status: { $in: ["WAITING", "OFFERED"] },
          joinedAt: { $lt: entry.joinedAt },
        });
        dynamicPosition = aheadCount + 1;
      } else if (entry.status === "OFFERED") {
        dynamicPosition = 1;
        const now = new Date();
        if (entry.offerExpiresAt && new Date(entry.offerExpiresAt) > now) {
          isOfferActive = true;
          secondsRemaining = Math.max(0, Math.floor((new Date(entry.offerExpiresAt) - now) / 1000));
        }
      }

      return {
        ...entry,
        queuePosition: dynamicPosition,
        isOfferActive,
        secondsRemaining,
      };
    })
  );

  return enriched;
}

/**
 * Admin manually promotes a specific waitlisted attendee to OFFERED status
 */
export async function adminPromoteWaitlistEntry(waitlistId) {
  const entry = await Waitlist.findById(waitlistId).populate("event");
  if (!entry) {
    const error = new Error("Waitlist entry not found.");
    error.statusCode = 404;
    throw error;
  }

  if (entry.status !== "WAITING") {
    const error = new Error(`Entry cannot be promoted because its status is already ${entry.status}.`);
    error.statusCode = 400;
    throw error;
  }

  const event = entry.event;
  if (!event) {
    const error = new Error("Associated event not found.");
    error.statusCode = 404;
    throw error;
  }

  // Decrement 1 available seat on event
  await Event.findByIdAndUpdate(event._id, { $inc: { availableSeats: -1 } });

  const offerToken = crypto.randomBytes(32).toString("hex");
  const offerExpiresAt = new Date(Date.now() + OFFER_DURATION_MS);

  entry.status = "OFFERED";
  entry.offeredAt = new Date();
  entry.offerExpiresAt = offerExpiresAt;
  entry.offerToken = offerToken;
  await entry.save();

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const claimUrl = `${frontendUrl}/events/${event.slug || event._id}?claimWaitlist=${offerToken}`;

  sendWaitlistOfferEmail({
    toEmail: entry.attendeeEmail,
    attendeeName: entry.attendeeName,
    eventTitle: event.title,
    eventDate: event.date,
    eventTime: event.time,
    venue: event.venue,
    price: event.price,
    offerExpiresAt,
    claimUrl,
  }).catch((err) => {
    console.error("Failed to send waitlist offer email:", err.message);
  });

  return entry;
}

/**
 * Get summary of waitlist for a specific event
 */
export async function getEventWaitlistSummary(eventId, userId = null, userEmail = null) {
  let resolvedEventId = eventId;
  if (typeof eventId === "string" && !/^[0-9a-fA-F]{24}$/.test(eventId)) {
    const foundEvt = await Event.findOne({ slug: eventId }).select("_id");
    if (!foundEvt) {
      return { activeCount: 0, isWaitlistFull: false, userEntry: null, maxCapacity: MAX_WAITLIST_CAPACITY };
    }
    resolvedEventId = foundEvt._id;
  }

  const activeCount = await getActiveWaitlistCount(resolvedEventId);
  const isWaitlistFull = activeCount >= MAX_WAITLIST_CAPACITY;

  let userEntry = null;
  const matchCriteria = [];
  if (userId) {
    matchCriteria.push({ user: userId });
  }
  if (userEmail) {
    matchCriteria.push({ attendeeEmail: userEmail.toLowerCase().trim() });
  }

  if (matchCriteria.length > 0) {
    const entry = await Waitlist.findOne({
      event: resolvedEventId,
      $or: matchCriteria,
      status: { $in: ["WAITING", "OFFERED"] },
    }).sort({ joinedAt: -1 }).lean();

    if (entry) {
      let dynamicPosition = 1;
      let secondsRemaining = 0;

      if (entry.status === "WAITING") {
        const aheadCount = await Waitlist.countDocuments({
          event: resolvedEventId,
          status: { $in: ["WAITING", "OFFERED"] },
          joinedAt: { $lt: entry.joinedAt },
        });
        dynamicPosition = aheadCount + 1;
      } else if (entry.status === "OFFERED") {
        const now = new Date();
        if (entry.offerExpiresAt && new Date(entry.offerExpiresAt) > now) {
          secondsRemaining = Math.max(0, Math.floor((new Date(entry.offerExpiresAt) - now) / 1000));
        }
      }

      userEntry = {
        ...entry,
        queuePosition: dynamicPosition,
        secondsRemaining,
      };
    }
  }

  return {
    activeCount,
    maxCapacity: MAX_WAITLIST_CAPACITY,
    isWaitlistFull,
    userEntry,
  };
}

export default {
  getActiveWaitlistCount,
  joinWaitlist,
  allocateSeatIfWaitlistExists,
  processExpiredOffers,
  leaveWaitlist,
  adminRemoveWaitlistEntry,
  adminPromoteWaitlistEntry,
  getUserWaitlistEntries,
  getEventWaitlistSummary,
};
