import Proposal from "../models/Proposal.js";
import { isDbConnected } from "../utils/memoryStore.js";

// In-memory fallback array for proposals if DB is disconnected
const inMemoryProposals = [];

/**
 * Public submission of event proposal
 */
export async function submitProposal(req, res) {
  try {
    const {
      hostName,
      hostEmail,
      title,
      category = "Design",
      city = "Kochi",
      format = "Studio Workshop (15–30 seats)",
      targetPrice = 0,
      description,
    } = req.body;

    if (!hostName || !hostEmail || !title || !description) {
      return res.status(400).json({
        error: "Please provide your full name, email address, event title, and session overview.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hostEmail.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const parsedPrice = Math.max(0, parseInt(targetPrice, 10) || 0);

    if (isDbConnected()) {
      const proposal = await Proposal.create({
        hostName: hostName.trim(),
        hostEmail: hostEmail.trim().toLowerCase(),
        title: title.trim(),
        category: category.trim(),
        city: city.trim(),
        format: format.trim(),
        targetPrice: parsedPrice,
        description: description.trim(),
        status: "pending",
        user: req.user?.id || null,
      });

      return res.status(201).json({
        message: "Proposal submitted successfully! Our curation team reviews submissions within 24 hours.",
        proposal,
      });
    }

    // In-memory fallback
    const proposal = {
      _id: Date.now().toString(16).padStart(24, "0"),
      hostName: hostName.trim(),
      hostEmail: hostEmail.trim().toLowerCase(),
      title: title.trim(),
      category: category.trim(),
      city: city.trim(),
      format: format.trim(),
      targetPrice: parsedPrice,
      description: description.trim(),
      status: "pending",
      adminNotes: "",
      user: req.user?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryProposals.unshift(proposal);

    return res.status(201).json({
      message: "Proposal submitted successfully! (Session Mode)",
      proposal,
    });
  } catch (error) {
    console.error("submitProposal error:", error);
    return res.status(500).json({ error: error.message || "Failed to submit proposal" });
  }
}

/**
 * Admin: Get all proposals with filter and stats
 */
export async function getAdminProposals(req, res) {
  try {
    const { status, search } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        filter.status = status;
      }
      if (search) {
        const query = search.trim();
        filter.$or = [
          { hostName: { $regex: query, $options: "i" } },
          { hostEmail: { $regex: query, $options: "i" } },
          { title: { $regex: query, $options: "i" } },
          { city: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
        ];
      }

      const proposals = await Proposal.find(filter).sort({ createdAt: -1 }).lean();

      // Stats counts
      const [totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
        Proposal.countDocuments(),
        Proposal.countDocuments({ status: "pending" }),
        Proposal.countDocuments({ status: "approved" }),
        Proposal.countDocuments({ status: "rejected" }),
      ]);

      return res.status(200).json({
        proposals,
        stats: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      });
    }

    // In-memory fallback
    let list = [...inMemoryProposals];
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      list = list.filter((p) => p.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.hostName.toLowerCase().includes(s) ||
          p.hostEmail.toLowerCase().includes(s) ||
          p.title.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      proposals: list,
      stats: {
        total: inMemoryProposals.length,
        pending: inMemoryProposals.filter((p) => p.status === "pending").length,
        approved: inMemoryProposals.filter((p) => p.status === "approved").length,
        rejected: inMemoryProposals.filter((p) => p.status === "rejected").length,
      },
    });
  } catch (error) {
    console.error("getAdminProposals error:", error);
    return res.status(500).json({ error: "Failed to load curator proposals" });
  }
}

/**
 * Admin: Update proposal status (approved, rejected, pending) & notes
 */
export async function updateProposalStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value. Must be pending, approved, or rejected." });
    }

    if (isDbConnected()) {
      const updateData = { status };
      if (typeof adminNotes === "string") {
        updateData.adminNotes = adminNotes.trim();
      }

      const updated = await Proposal.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      return res.status(200).json({
        message: `Proposal marked as ${status}`,
        proposal: updated,
      });
    }

    const p = inMemoryProposals.find((item) => item._id === id);
    if (!p) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    p.status = status;
    if (typeof adminNotes === "string") {
      p.adminNotes = adminNotes.trim();
    }
    p.updatedAt = new Date().toISOString();

    return res.status(200).json({
      message: `Proposal marked as ${status}`,
      proposal: p,
    });
  } catch (error) {
    console.error("updateProposalStatus error:", error);
    return res.status(500).json({ error: "Failed to update proposal status" });
  }
}

/**
 * Admin: Delete a proposal
 */
export async function deleteProposal(req, res) {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await Proposal.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      return res.status(200).json({ message: "Proposal deleted successfully" });
    }

    const idx = inMemoryProposals.findIndex((item) => item._id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    inMemoryProposals.splice(idx, 1);

    return res.status(200).json({ message: "Proposal deleted successfully" });
  } catch (error) {
    console.error("deleteProposal error:", error);
    return res.status(500).json({ error: "Failed to delete proposal" });
  }
}
