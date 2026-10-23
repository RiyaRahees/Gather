import mongoose from "mongoose";

const WaitlistSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["WAITING", "OFFERED", "CONFIRMED", "EXPIRED", "CANCELLED", "REMOVED"],
      default: "WAITING",
      index: true,
    },
    queuePosition: {
      type: Number,
      default: 1,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    offeredAt: {
      type: Date,
      default: null,
    },
    offerExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    offerToken: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    claimedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid queue querying and active member lookups
WaitlistSchema.index({ event: 1, status: 1, joinedAt: 1 });
WaitlistSchema.index({ event: 1, user: 1, status: 1 });

export default mongoose.models.Waitlist || mongoose.model("Waitlist", WaitlistSchema);
