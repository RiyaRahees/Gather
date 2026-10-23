import mongoose from "mongoose";
import crypto from "crypto";

const BookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: [1, "Must book at least 1 seat"],
      default: 1,
    },
    attendeeName: {
      type: String,
      required: true,
    },
    attendeeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled", "pending"],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["completed", "free", "pending", "failed"],
      default: "free",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    confirmedAt: {
      type: Date,
      default: Date.now,
    },
    cancellationSecret: {
      type: String,
      default: () => crypto.randomBytes(20).toString("hex"),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ user: 1, event: 1 });
BookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
