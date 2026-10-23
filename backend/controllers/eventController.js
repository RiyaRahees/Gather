import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import { isDbConnected, inMemoryEvents } from "../utils/memoryStore.js";
import { allocateSeatIfWaitlistExists } from "../services/waitlistService.js";

export async function getEvents(req, res) {
  try {
    const { category, search, sort, featured, location } = req.query;

    if (isDbConnected()) {
      const query = { isPublished: true };

      if (category && category !== "all" && category !== "All") {
        query.category = new RegExp(`^${category}$`, "i");
      }

      if (featured === "true") {
        query.isFeatured = true;
      }

      if (location && location !== "all" && location !== "All") {
        query.venue = new RegExp(location, "i");
      }

      if (search && search.trim()) {
        const term = search.trim();
        query.$or = [
          { title: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
          { venue: { $regex: term, $options: "i" } },
          { category: { $regex: term, $options: "i" } },
          { organizerName: { $regex: term, $options: "i" } },
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === "price-low") sortOptions = { price: 1 };
      if (sort === "price-high") sortOptions = { price: -1 };
      if (sort === "seats") sortOptions = { availableSeats: -1 };

      const events = await Event.find(query).sort(sortOptions).lean();
      return res.status(200).json({ events: events || [] });
    }

    // Fallback: In-memory resilient store when DB connection is pending Atlas whitelist
    let filtered = inMemoryEvents.filter((e) => e.isPublished !== false);

    if (category && category !== "all" && category !== "All") {
      filtered = filtered.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (featured === "true") {
      filtered = filtered.filter((e) => e.isFeatured);
    }

    if (location && location !== "all" && location !== "All") {
      filtered = filtered.filter((e) =>
        e.venue.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.venue.toLowerCase().includes(term) ||
          e.category.toLowerCase().includes(term) ||
          (e.organizerName && e.organizerName.toLowerCase().includes(term))
      );
    }

    if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
    else if (sort === "seats") filtered.sort((a, b) => b.availableSeats - a.availableSeats);
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ events: filtered });
  } catch (error) {
    console.error("getEvents error:", error);
    return res.status(500).json({ error: "Failed to fetch events from database" });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      let event = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        event = await Event.findById(id).lean();
      }

      if (!event) {
        event = await Event.findOne({ slug: id }).lean();
      }

      if (event) {
        return res.status(200).json({ event });
      }
    }

    // Fallback in-memory lookup
    const fallbackEvent = inMemoryEvents.find((e) => e._id === id || e.slug === id);
    if (!fallbackEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ event: fallbackEvent });
  } catch (error) {
    console.error("getEventById error:", error);
    return res.status(500).json({ error: "Failed to retrieve event" });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      category,
      image,
      date,
      time,
      venue,
      isOnline,
      price,
      currency,
      totalSeats,
      organizerName,
      isFeatured,
      isPublished,
    } = req.body;

    if (!title || !description || !category || !date || !time || !venue || totalSeats === undefined) {
      return res.status(400).json({
        error: "Missing required fields: title, description, category, date, time, venue, totalSeats.",
      });
    }

    const parsedTotalSeats = parseInt(totalSeats, 10);
    if (isNaN(parsedTotalSeats) || parsedTotalSeats < 1) {
      return res.status(400).json({ error: "Total seat capacity must be at least 1" });
    }

    const parsedPrice = parseFloat(price) || 0;

    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (isDbConnected()) {
      const existingSlug = await Event.findOne({ slug });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const newEvent = await Event.create({
        title: title.trim(),
        slug,
        description: description.trim(),
        category,
        image: image || "/images/event-design-studio.jpg",
        date,
        time,
        venue,
        isOnline: !!isOnline,
        price: parsedPrice,
        currency: currency || "₹",
        totalSeats: parsedTotalSeats,
        availableSeats: parsedTotalSeats,
        organizerName: organizerName ? organizerName.trim() : "EventFlow Curator",
        isFeatured: !!isFeatured,
        isPublished: isPublished !== false,
        createdBy: req.user?.id,
      });

      return res.status(201).json({
        message: "Event created successfully",
        event: newEvent,
      });
    }

    // In-memory creation
    const newEvent = {
      _id: Date.now().toString(16).padStart(24, "0"),
      title: title.trim(),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: description.trim(),
      category,
      image: image || "/images/event-design-studio.jpg",
      date,
      time,
      venue,
      isOnline: !!isOnline,
      price: parsedPrice,
      currency: currency || "₹",
      totalSeats: parsedTotalSeats,
      availableSeats: parsedTotalSeats,
      organizerName: organizerName ? organizerName.trim() : "EventFlow Curator",
      isFeatured: !!isFeatured,
      isPublished: isPublished !== false,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || "admin",
    };

    inMemoryEvents.unshift(newEvent);

    return res.status(201).json({
      message: "Event created successfully (In-Memory Session)",
      event: newEvent,
    });
  } catch (error) {
    console.error("createEvent error:", error);
    return res.status(500).json({ error: error.message || "Failed to create event" });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (isDbConnected()) {
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (updateData.totalSeats !== undefined) {
        const newTotal = parseInt(updateData.totalSeats, 10);
        if (isNaN(newTotal) || newTotal < 1) {
          return res.status(400).json({ error: "Total seats must be at least 1" });
        }

        const bookedCount = event.totalSeats - event.availableSeats;
        if (newTotal < bookedCount) {
          return res.status(400).json({
            error: `Cannot reduce total seats below already booked count (${bookedCount})`,
          });
        }

        updateData.totalSeats = newTotal;
        updateData.availableSeats = newTotal - bookedCount;
      }

      const updated = await Event.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Automatically allocate newly available seats to waitlisted attendees in order!
      if (updated && updated.availableSeats > 0) {
        let hasMoreWaitlist = true;
        while (hasMoreWaitlist) {
          const entry = await allocateSeatIfWaitlistExists(updated._id);
          if (!entry) {
            hasMoreWaitlist = false;
          }
        }
      }

      return res.status(200).json({
        message: "Event updated successfully",
        event: updated,
      });
    }

    // In-memory update
    const idx = inMemoryEvents.findIndex((e) => e._id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existing = inMemoryEvents[idx];
    if (updateData.totalSeats !== undefined) {
      const newTotal = parseInt(updateData.totalSeats, 10);
      const bookedCount = existing.totalSeats - existing.availableSeats;
      if (newTotal < bookedCount) {
        return res.status(400).json({
          error: `Cannot reduce total seats below already booked count (${bookedCount})`,
        });
      }
      updateData.totalSeats = newTotal;
      updateData.availableSeats = newTotal - bookedCount;
    }

    const updated = { ...existing, ...updateData, updatedAt: new Date().toISOString() };
    inMemoryEvents[idx] = updated;

    return res.status(200).json({
      message: "Event updated successfully",
      event: updated,
    });
  } catch (error) {
    console.error("updateEvent error:", error);
    return res.status(500).json({ error: "Failed to update event" });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const confirmedBookings = await Booking.countDocuments({
        event: id,
        bookingStatus: "confirmed",
      });

      if (confirmedBookings > 0) {
        return res.status(400).json({
          error: `Cannot delete event: ${confirmedBookings} ${confirmedBookings === 1 ? "person is" : "people are"} currently booked for this event. Please unpublish the event instead to protect confirmed reservations.`,
          bookedCount: confirmedBookings,
        });
      }

      await Event.findByIdAndDelete(id);
      return res.status(200).json({ message: "Event deleted successfully" });
    }

    // In-memory deletion
    const idx = inMemoryEvents.findIndex((e) => e._id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Event not found" });
    }

    const inMemBooked = inMemoryBookings.filter(
      (b) => (b.event?._id === id || b.event === id) && b.bookingStatus === "confirmed"
    ).length;

    if (inMemBooked > 0) {
      return res.status(400).json({
        error: `Cannot delete event: ${inMemBooked} ${inMemBooked === 1 ? "person is" : "people are"} currently booked for this event. Please unpublish the event instead to protect confirmed reservations.`,
        bookedCount: inMemBooked,
      });
    }

    inMemoryEvents.splice(idx, 1);
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    return res.status(500).json({ error: "Failed to delete event" });
  }
}

export default { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
