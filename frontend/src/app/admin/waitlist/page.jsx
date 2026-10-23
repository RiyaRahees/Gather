"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Users,
  Calendar,
  ArrowLeft,
  Timer,
  RefreshCw,
} from "lucide-react";

function formatOrdinal(n) {
  const num = parseInt(n, 10) || 1;
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return {
    num,
    ordinal: `${num}${suffix}`,
  };
}

export default function AdminWaitlistPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({
    totalWaiting: 0,
    totalOffered: 0,
    totalConfirmed: 0,
    totalCancelled: 0,
    totalExpired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  // Remove confirmation state
  const [removeState, setRemoveState] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [promotingId, setPromotingId] = useState(null);

  const handlePromoteEntry = async (item) => {
    setPromotingId(item._id);
    setError("");
    setFeedback("");
    try {
      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch(`/api/waitlist/admin/${item._id}/promote`, {
        method: "POST",
        headers,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to promote waitlist entry.");
      }

      setFeedback(`Promoted ${item.attendeeName} to seat offer! Notification email with payment link sent.`);
      fetchWaitlistEntries();
    } catch (err) {
      setError(err.message || "Failed to promote entry.");
    } finally {
      setPromotingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchWaitlistEntries();
    }
  }, [user, authLoading, isAdmin, statusFilter]);

  const fetchWaitlistEntries = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch(`/api/waitlist/admin?${params.toString()}`, {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.stats) setStats(data.stats);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to load waitlist data.");
      }
    } catch (err) {
      console.error("Failed to load waitlist:", err);
      setError("Network error while connecting to waitlist API.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeState) return;
    setRemoving(true);
    try {
      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch(`/api/waitlist/admin/${removeState._id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove waitlist entry.");
      }

      setFeedback(`Removed ${removeState.attendeeName} from waitlist. Seat availability updated.`);
      setRemoveState(null);
      fetchWaitlistEntries();
    } catch (err) {
      setError(err.message || "Failed to remove entry.");
    } finally {
      setRemoving(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.attendeeName?.toLowerCase().includes(q) ||
      e.attendeeEmail?.toLowerCase().includes(q) ||
      e.event?.title?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status, offerExpiresAt) => {
    switch (status) {
      case "OFFERED":
        const isStillValid = offerExpiresAt && new Date(offerExpiresAt) > new Date();
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#FFF9EE] text-[#8C4A00] border border-[#FAD7A0]">
            <Sparkles className="w-3 h-3 text-[#C2A265]" />
            {isStillValid ? "Seat Offered (Active)" : "Offer Expiring"}
          </span>
        );
      case "WAITING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EBF3E8] text-[#073F2E] border border-[#A9C3A0]/60">
            <Clock className="w-3 h-3" />
            In Queue
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Pass Claimed
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <Timer className="w-3 h-3" />
            Expired
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-300">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case "REMOVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3" />
            Admin Removed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E2D8]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77776F] hover:text-[#073F2E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#171915]">Waitlist Management</h1>
          <p className="text-xs text-[#77776F] mt-1 max-w-2xl">
            Monitor real-time attendee priority queues, automated 2-hour seat promotion offers, and claims.
          </p>
        </div>

        <button
          onClick={fetchWaitlistEntries}
          className="btn-secondary px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 self-start md:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Metric KPI Cards matching Events page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Waiting in Queue */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Waiting in queue</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {stats.totalWaiting}
            </div>
            <div className="text-[11px] text-[#77776F]">Active waitlist attendees</div>
          </div>
        </div>

        {/* Card 2: Active Offers */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Active seat offers</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {stats.totalOffered}
            </div>
            <div className="text-[11px] text-[#2563EB] font-medium">2-hour window active</div>
          </div>
        </div>

        {/* Card 3: Passes Claimed */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Passes claimed</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {stats.totalConfirmed}
            </div>
            <div className="text-[11px] text-[#77776F]">Converted to confirmed seats</div>
          </div>
        </div>

        {/* Card 4: Expired / Released */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
            <Timer className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Expired / Left</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {stats.totalExpired + stats.totalCancelled}
            </div>
            <div className="text-[11px] text-[#77776F]">Unclaimed or cancelled spots</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E7E2D8] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#77776F] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search attendee or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:outline-none focus:border-[#073F2E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#77776F]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] font-semibold text-[#171915] focus:outline-none focus:border-[#073F2E]"
          >
            <option value="all">All Statuses</option>
            <option value="WAITING">Waiting in Queue</option>
            <option value="OFFERED">Offered Seats</option>
            <option value="CONFIRMED">Claimed &amp; Confirmed</option>
            <option value="EXPIRED">Offer Expired</option>
            <option value="CANCELLED">User Cancelled</option>
            <option value="REMOVED">Admin Removed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-[#77776F] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#073F2E]" />
            <p className="text-xs">Loading waitlist entries...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E7E2D8] bg-[#FAF8F5] text-[#77776F] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Event / Session</th>
                  <th className="py-3.5 px-4">Attendee</th>
                  <th className="py-3.5 px-4">Queue Position</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined At</th>
                  <th className="py-3.5 px-4">Offer Expiry</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {filteredEntries.map((item) => {
                  const evt = item.event;
                  const isOffered = item.status === "OFFERED";
                  const offerExpiryFormatted = item.offerExpiresAt
                    ? new Date(item.offerExpiresAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr key={item._id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#171915] max-w-xs truncate">
                          {evt?.title || "Gather Session"}
                        </div>
                        <div className="text-[11px] text-[#77776F]">{evt?.date} &bull; {evt?.venue}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#171915]">{item.attendeeName}</div>
                        <div className="text-[11px] text-[#77776F]">{item.attendeeEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#073F2E] bg-[#EBF3E8] px-2.5 py-0.5 rounded-full text-xs">
                          #{item.queuePosition || 1}
                          <span className="text-[10px] text-[#073F2E]/70 ml-1 font-sans">
                            {formatOrdinal(item.queuePosition || 1).ordinal}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.status, item.offerExpiresAt)}
                      </td>

                      <td className="py-3.5 px-4 text-[#77776F]">
                        {new Date(item.joinedAt || item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOffered ? (
                          <span className="font-mono text-amber-800 font-bold bg-[#FFF9EE] px-2 py-0.5 rounded-md border border-[#FAD7A0]">
                            {offerExpiryFormatted}
                          </span>
                        ) : (
                          <span className="text-[#77776F]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "WAITING" && (
                            <button
                              onClick={() => handlePromoteEntry(item)}
                              disabled={promotingId === item._id}
                              className="text-[#073F2E] hover:text-[#052F22] bg-[#EBF3E8] hover:bg-[#D5E3D2] font-semibold text-xs px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Offer seat and email direct payment link now"
                            >
                              {promotingId === item._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-[#073F2E]" />
                              )}
                              <span>Offer Seat</span>
                            </button>
                          )}
                          {item.status === "WAITING" || item.status === "OFFERED" ? (
                            <button
                              onClick={() => setRemoveState(item)}
                              className="text-red-600 hover:text-red-800 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Remove
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#77776F] space-y-2">
            <Users className="w-8 h-8 mx-auto text-gray-400" />
            <h3 className="font-semibold text-sm text-[#171915]">No waitlist entries found</h3>
            <p className="text-xs">There are no attendees in the waitlist matching your current filters.</p>
          </div>
        )}
      </div>

      {/* Admin Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(removeState)}
        title="Remove Waitlist Entry?"
        description={
          removeState?.status === "OFFERED"
            ? `Attendee ${removeState?.attendeeName} currently has an active seat offer! If you remove this entry, the seat will automatically be offered to the next waitlisted attendee.`
            : `Are you sure you want to remove ${removeState?.attendeeName} (${removeState?.attendeeEmail}) from the waitlist for "${removeState?.event?.title}"?`
        }
        confirmText="Remove Entry"
        cancelText="Cancel"
        variant="danger"
        loading={removing}
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveState(null)}
      />

    </div>
  );
}
