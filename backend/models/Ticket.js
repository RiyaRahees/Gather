import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    seatNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["valid", "checked_in", "cancelled"],
      default: "valid",
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid lookups and constraints
TicketSchema.index({ booking: 1, seatNumber: 1 }, { unique: true });
TicketSchema.index({ event: 1, status: 1 });
TicketSchema.index({ user: 1, status: 1 });

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
