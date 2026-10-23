import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Technology", "Design", "Business", "Marketing", "Personal Growth", "Creative Arts"],
    },
    image: {
      type: String,
      required: [true, "Cover image path is required"],
      default: "/images/event-design-studio.jpg",
    },
    date: {
      type: String,
      required: [true, "Date is required (e.g. Oct 24, 2026)"],
    },
    time: {
      type: String,
      required: [true, "Time is required (e.g. 10:00 AM - 4:00 PM IST)"],
    },
    venue: {
      type: String,
      required: [true, "Venue or location is required"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      default: "₹",
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seat capacity is required"],
      min: [1, "Total seats must be at least 1"],
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, "Available seats cannot be negative"],
    },
    organizerName: {
      type: String,
      required: true,
      default: "Gather Curator",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for rapid search & filters
EventSchema.index({ category: 1, isPublished: 1 });
EventSchema.index({ title: "text", description: "text", venue: "text" });

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
