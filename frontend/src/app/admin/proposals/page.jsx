"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  Trash2,
  ExternalLink,
  MapPin,
  Tag,
  DollarSign,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  PlusCircle,
  Check,
  Building2,
  FileText,
} from "lucide-react";

export default function AdminProposalsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Proposal for Review Drawer / Modal
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Delete State
  const [deleteProposalState, setDeleteProposalState] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getAdminHeaders = () => {
    const adminToken =
      (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
      (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    return adminToken
      ? {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
          Authorization: `Bearer ${adminToken}`,
        }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchProposals();
    }
  }, [user, authLoading, isAdmin, statusFilter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const url = getApiUrl(`/api/proposals/admin?${params.toString()}`);
      const res = await fetch(url, {
        headers: getAdminHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
      setErrorMsg("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProposals();
  };

  const openReviewModal = (proposal) => {
    setSelectedProposal(proposal);
    setAdminNotes(proposal.adminNotes || "");
    setFeedback("");
    setErrorMsg("");
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedProposal) return;
    setUpdatingStatus(true);
    setFeedback("");
    setErrorMsg("");

    try {
      const url = getApiUrl(`/api/proposals/admin/${selectedProposal._id}/status`);
      const res = await fetch(url, {
        method: "PATCH",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update proposal status");
      }

      setFeedback(`Proposal updated to "${newStatus}"`);
      setSelectedProposal(data.proposal);
      fetchProposals();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!deleteProposalState) return;
    setDeleteLoading(true);
    try {
      const url = getApiUrl(`/api/proposals/admin/${deleteProposalState._id}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: getAdminHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete proposal");
      }

      setFeedback("Proposal deleted successfully");
      if (selectedProposal?._id === deleteProposalState._id) {
        setSelectedProposal(null);
      }
      fetchProposals();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete proposal");
    } finally {
      setDeleteLoading(false);
      setDeleteProposalState(null);
    }
  };

  const handleConvertToEvent = (proposal) => {
    const params = new URLSearchParams({
      create: "true",
      title: proposal.title,
      category: proposal.category || "Design",
      venue: proposal.city ? `${proposal.city} Creative Hub` : "Fort Kochi Studio",
      price: proposal.targetPrice?.toString() || "0",
      organizer: proposal.hostName,
      description: proposal.description,
    });

    router.push(`/admin/events?${params.toString()}`);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF3E8] text-[#073F2E] text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curator Submissions</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#171915]">
            Host Concept Proposals
          </h1>
          <p className="text-xs sm:text-sm text-[#77776F] mt-1">
            Review and approve incoming workshop and masterclass proposals submitted by instructors and creators.
          </p>
        </div>

        <Link
          href="/host"
          target="_blank"
          className="btn-secondary px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>View Public Submission Form</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-700 hover:text-red-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77776F] block">
            Total Submissions
          </span>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#171915] mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77776F]">
              Pending Review
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-700 mt-1 block">
            {stats.pending}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77776F] block">
            Approved Concepts
          </span>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#073F2E] mt-1 block">
            {stats.approved}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77776F] block">
            Archived / Rejected
          </span>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-gray-500 mt-1 block">
            {stats.rejected}
          </span>
        </div>
      </div>

      {/* Control Bar: Filter Tabs + Search */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${stats.total})` },
            { id: "pending", label: `Pending (${stats.pending})` },
            { id: "approved", label: `Approved (${stats.approved})` },
            { id: "rejected", label: `Rejected (${stats.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#073F2E] text-white"
                  : "bg-[#F7F4ED] text-[#77776F] hover:text-[#171915]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77776F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search curator, title, city..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E]"
          />
        </form>
      </div>

      {/* Proposals List Table */}
      {loading ? (
        <div className="py-20 text-center text-[#77776F] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-[#073F2E]" />
          <p className="text-xs">Loading curator proposals...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7E2D8] p-12 text-center max-w-md mx-auto space-y-3">
          <FileText className="w-12 h-12 text-[#A9C3A0] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#171915]">No proposals found</h3>
          <p className="text-xs text-[#77776F]">
            {statusFilter !== "all"
              ? `There are no proposals marked as "${statusFilter}".`
              : "No curator concepts have been submitted yet. Proposals submitted via the public Host page will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E2D8] text-[10px] uppercase font-bold tracking-wider text-[#77776F]">
                  <th className="py-3.5 px-5">Event Title & Discipline</th>
                  <th className="py-3.5 px-5">Curator / Host</th>
                  <th className="py-3.5 px-5">Location & Format</th>
                  <th className="py-3.5 px-5">Target Price</th>
                  <th className="py-3.5 px-5">Submitted</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D8]/60">
                {proposals.map((p) => {
                  const statusColors = {
                    pending: "bg-amber-100 text-amber-800 border-amber-200",
                    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    rejected: "bg-gray-100 text-gray-700 border-gray-200",
                  };

                  return (
                    <tr key={p._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Concept Title */}
                      <td className="py-4 px-5 max-w-[260px]">
                        <p className="font-serif font-bold text-[#171915] truncate text-sm">
                          {p.title}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3E8] text-[#073F2E]">
                          {p.category}
                        </span>
                      </td>

                      {/* Curator */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#171915]">{p.hostName}</div>
                        <a
                          href={`mailto:${p.hostEmail}`}
                          className="text-[11px] text-[#77776F] hover:text-[#073F2E] underline"
                        >
                          {p.hostEmail}
                        </a>
                      </td>

                      {/* Location & Format */}
                      <td className="py-4 px-5 text-[#171915]">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-[#073F2E]" />
                          <span>{p.city}</span>
                        </div>
                        <span className="text-[11px] text-[#77776F] block mt-0.5 truncate max-w-[180px]">
                          {p.format}
                        </span>
                      </td>

                      {/* Target Price */}
                      <td className="py-4 px-5 font-numeric font-bold text-[#171915]">
                        {p.targetPrice === 0 ? "Free" : `₹${p.targetPrice}`}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-5 text-[#77776F] text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                            statusColors[p.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => openReviewModal(p)}
                          className="btn-secondary px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#073F2E]" />
                          <span>Review</span>
                        </button>

                        <button
                          onClick={() => setDeleteProposalState(p)}
                          className="p-1.5 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete proposal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Action Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E7E2D8] max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E7E2D8] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#073F2E] bg-[#EBF3E8] px-2.5 py-1 rounded-full">
                  {selectedProposal.category}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#171915] mt-2">
                  {selectedProposal.title}
                </h2>
                <p className="text-xs text-[#77776F] mt-1">
                  Submitted by <strong className="text-[#171915]">{selectedProposal.hostName}</strong> (
                  <a href={`mailto:${selectedProposal.hostEmail}`} className="underline text-[#073F2E]">
                    {selectedProposal.hostEmail}
                  </a>
                  )
                </p>
              </div>

              <button
                onClick={() => setSelectedProposal(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-[#171915] hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Quick Specs Pill Grid */}
            <div className="grid grid-cols-3 gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E7E2D8] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#77776F] block">City</span>
                <span className="font-semibold text-[#171915]">{selectedProposal.city}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#77776F] block">Format</span>
                <span className="font-semibold text-[#171915] truncate block">{selectedProposal.format}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#77776F] block">Target Ticket</span>
                <span className="font-semibold text-[#171915] font-numeric">
                  {selectedProposal.targetPrice === 0 ? "Free" : `₹${selectedProposal.targetPrice}`}
                </span>
              </div>
            </div>

            {/* Session Overview & Outcomes */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77776F]">
                Session Overview &amp; Learning Outcomes
              </h3>
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7E2D8] text-xs leading-relaxed text-[#171915] whitespace-pre-wrap">
                {selectedProposal.description}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#77776F] block">
                Internal Admin Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Host is available second week of next month. Venue matched with Kochi studio."
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E]"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-[#E7E2D8] flex flex-wrap items-center justify-between gap-3">
              {/* Status Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#77776F]">Status:</span>
                <button
                  type="button"
                  disabled={updatingStatus || selectedProposal.status === "approved"}
                  onClick={() => handleStatusChange("approved")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    selectedProposal.status === "approved"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  ✓ Approve
                </button>

                <button
                  type="button"
                  disabled={updatingStatus || selectedProposal.status === "rejected"}
                  onClick={() => handleStatusChange("rejected")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    selectedProposal.status === "rejected"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                  }`}
                >
                  ✕ Reject
                </button>

                {selectedProposal.status !== "pending" && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("pending")}
                    className="px-2.5 py-1.5 rounded-full text-xs text-[#77776F] hover:text-[#171915] underline cursor-pointer"
                  >
                    Reset to Pending
                  </button>
                )}
              </div>

              {/* Conversion CTA */}
              <button
                type="button"
                onClick={() => handleConvertToEvent(selectedProposal)}
                className="btn-forest px-5 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Event from Proposal</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteProposalState)}
        title="Delete Curator Proposal?"
        description={`Are you sure you want to delete the concept "${deleteProposalState?.title}" by ${deleteProposalState?.hostName}? This action cannot be undone.`}
        confirmText="Delete Proposal"
        cancelText="Keep"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteProposal}
        onClose={() => !deleteLoading && setDeleteProposalState(null)}
      />
    </div>
  );
}
