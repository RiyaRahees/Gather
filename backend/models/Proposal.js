import mongoose from "mongoose";

const ProposalSchema = new mongoose.Schema(
  {
    hostName: {
      type: String,
      required: [true, "Host name is required"],
      trim: true,
    },
    hostEmail: {
      type: String,
      required: [true, "Host email is required"],
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, "Proposed event title is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Discipline/category is required"],
      enum: ["Design", "Technology", "Business", "Marketing", "Personal Growth", "Creative Arts", "Other"],
      default: "Design",
    },
    city: {
      type: String,
      required: [true, "Location/city is required"],
      trim: true,
      default: "Kochi",
    },
    format: {
      type: String,
      trim: true,
      default: "Studio Workshop (15–30 seats)",
    },
    targetPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: [true, "Session overview & learning outcomes are required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

ProposalSchema.index({ createdAt: -1 });

export default mongoose.models.Proposal || mongoose.model("Proposal", ProposalSchema);
