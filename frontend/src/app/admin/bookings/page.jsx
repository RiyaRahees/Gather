"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PriceTag from "@/components/common/PriceTag";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Download,
  Calendar,
  MapPin,
  Layers,
  ExternalLink,
  Ticket,
  Check,
  X,
  Sparkles,
  ChevronRight,
  CreditCard,
} from "lucide-react";

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("all");

  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch events list once
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchEvents();
      fetchAllBookingsForStats();
    }
  }, [user, authLoading, isAdmin]);

  // Fetch filtered bookings whenever filters or selected event change
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchBookings();
    }
  }, [user, authLoading, isAdmin, selectedEventId, statusFilter]);

  const getAuthHeaders = () => {
    const adminToken =
      (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
      (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    return adminToken
      ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
      : {};
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load admin events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Used to calculate real attendee counts per event card
  const fetchAllBookingsForStats = async () => {
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAllBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch all bookings for stats:", err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (selectedEventId !== "all") params.set("eventId", selectedEventId);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  // Compute attendee statistics per event
  const eventStatsMap = useMemo(() => {
    const map = {};
    allBookings.forEach((b) => {
      const eId = (b.event?._id || b.event)?.toString();
      if (!eId) return;
      if (!map[eId]) {
        map[eId] = {
          totalBookings: 0,
          confirmedBookings: 0,
          confirmedSeats: 0,
          totalRevenue: 0,
        };
      }
      map[eId].totalBookings++;
      if (b.bookingStatus === "confirmed") {
        map[eId].confirmedBookings++;
        map[eId].confirmedSeats += b.seatsBooked || 1;
        map[eId].totalRevenue += b.amount || 0;
      }
    });
    return map;
  }, [allBookings]);

  // Selected event object (if not 'all')
  const activeEvent = useMemo(() => {
    if (selectedEventId === "all") return null;
    return events.find((e) => e._id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Quick CSV Export
  const exportToCsv = () => {
    if (!bookings.length) return;
    const headers = [
      "Booking Ref",
      "Attendee Name",
      "Attendee Email",
      "Event Title",
      "Seats",
      "Amount",
      "Booking Status",
      "Payment Status",
      "Date",
    ];
    const rows = bookings.map((b) => [
      `"${b.bookingRef || ""}"`,
      `"${b.attendeeName || ""}"`,
      `"${b.attendeeEmail || ""}"`,
      `"${b.event?.title || activeEvent?.title || ""}"`,
      b.seatsBooked || 1,
      b.amount || 0,
      b.bookingStatus || "",
      b.paymentStatus || "",
      new Date(b.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees_${selectedEventId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute overall summary metrics for the top cards
  const summaryMetrics = useMemo(() => {
    const list = allBookings.length > 0 ? allBookings : bookings;
    const totalBookings = list.length;
    const confirmedList = list.filter((b) => b.bookingStatus === "confirmed");
    const confirmedCount = confirmedList.length;
    const confirmedSeats = confirmedList.reduce((sum, b) => sum + (b.seatsBooked || 1), 0);
    const totalRevenue = confirmedList.reduce((sum, b) => sum + (b.amount || 0), 0);
    const pendingCount = list.filter(
      (b) => b.bookingStatus === "pending" || b.paymentStatus === "pending"
    ).length;

    return {
      totalBookings,
      confirmedCount,
      confirmedSeats,
      totalRevenue,
      pendingCount,
    };
  }, [allBookings, bookings]);

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
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#171915]">
            Registered Attendees &amp; Bookings
          </h1>
          <p className="text-xs text-[#77776F] mt-1.5 max-w-2xl">
            Select an event session first to review its confirmed attendee registry, check-in status, and revenue breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportToCsv}
            disabled={!bookings.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E7E2D8] text-xs font-semibold text-[#171915] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#073F2E]" />
            <span>Export CSV</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#073F2E] text-white text-xs font-semibold shadow-2xs">
            <Users className="w-3.5 h-3.5" />
            <span>{bookings.length} Attendees Shown</span>
          </span>
        </div>
      </div>

      {/* 4 Metric KPI Cards matching Events page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Bookings */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Total bookings</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {summaryMetrics.totalBookings}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
              <span>↗</span>
              <span>{summaryMetrics.confirmedCount} confirmed passes</span>
            </div>
          </div>
        </div>

        {/* Card 2: Confirmed Seats */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Confirmed seats</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {summaryMetrics.confirmedSeats}
            </div>
            <div className="text-[11px] text-[#77776F]">Across all scheduled sessions</div>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Collected revenue</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              ₹{summaryMetrics.totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-[#77776F]">Verified transactions</div>
          </div>
        </div>

        {/* Card 4: Pending Bookings */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Pending checkouts</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {summaryMetrics.pendingCount}
            </div>
            <div className="text-[11px] text-[#77776F]">Awaiting gateway capture</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: EVENTS FIRST (EVENT SELECTION CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#073F2E] text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#171915]">
              Select Event Session
            </h2>
          </div>
          <span className="text-xs text-[#77776F]">
            Click any event to filter attendee list below
          </span>
        </div>

        {/* Horizontal Event Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card: All Events Overview */}
          <button
            type="button"
            onClick={() => setSelectedEventId("all")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-2xs ${
              selectedEventId === "all"
                ? "bg-[#FAF8F5] border-[#073F2E] ring-2 ring-[#073F2E]/20 shadow-sm"
                : "bg-white border-[#E7E2D8] hover:border-[#073F2E]/40 hover:bg-[#FAF8F5]/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3E8] text-[#073F2E]">
                  All Sessions
                </span>
                <Layers className={`w-4 h-4 ${selectedEventId === "all" ? "text-[#073F2E]" : "text-[#77776F]"}`} />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#171915] line-clamp-1">
                All Events Overview
              </h3>
              <p className="text-[11px] text-[#77776F] mt-1">
                Showing all attendee bookings across entire catalogue
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-[#E7E2D8]/70 flex items-center justify-between text-xs">
              <span className="text-[#77776F] font-medium">Total Registrations</span>
              <span className="font-bold text-[#073F2E] text-sm">{allBookings.length}</span>
            </div>
          </button>

          {/* Cards for each individual event */}
          {eventsLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[#E7E2D8] bg-white animate-pulse h-36 flex flex-col justify-between"
              >
                <div className="h-4 bg-[#E7E2D8]/60 rounded w-1/3 mb-2" />
                <div className="h-5 bg-[#E7E2D8]/60 rounded w-4/5" />
                <div className="h-3 bg-[#E7E2D8]/40 rounded w-2/3" />
                <div className="h-3 bg-[#E7E2D8]/60 rounded w-full mt-2" />
              </div>
            ))
          ) : (
            events.map((evt) => {
              const isSelected = selectedEventId === evt._id;
              const stats = eventStatsMap[evt._id] || {
                totalBookings: 0,
                confirmedBookings: 0,
                confirmedSeats: 0,
                totalRevenue: 0,
              };
              const totalSeats = evt.totalSeats || 25;
              const confirmedSeats = stats.confirmedSeats;
              const percentFull = Math.min(100, Math.round((confirmedSeats / totalSeats) * 100));

              return (
                <button
                  key={evt._id}
                  type="button"
                  onClick={() => setSelectedEventId(evt._id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-2xs group ${
                    isSelected
                      ? "bg-[#FAF8F5] border-[#073F2E] ring-2 ring-[#073F2E]/20 shadow-sm"
                      : "bg-white border-[#E7E2D8] hover:border-[#073F2E]/40 hover:bg-[#FAF8F5]/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#171915] border border-[#E7E2D8]">
                        {evt.category || "Workshop"}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-[#073F2E] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#073F2E]">
                          {evt.price === 0 ? "Free" : `₹${evt.price}`}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`font-serif font-bold text-sm line-clamp-1 group-hover:text-[#073F2E] transition-colors ${
                        isSelected ? "text-[#073F2E]" : "text-[#171915]"
                      }`}
                      title={evt.title}
                    >
                      {evt.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[10px] text-[#77776F] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {evt.date || "Date TBA"}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[110px]">{evt.venue || "Venue"}</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E7E2D8]/70">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#77776F]">Attendees:</span>
                      <span className="font-bold text-[#171915]">
                        {confirmedSeats} / {totalSeats} seats
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full bg-[#E7E2D8] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentFull >= 100
                            ? "bg-red-600"
                            : percentFull >= 80
                            ? "bg-amber-600"
                            : "bg-[#073F2E]"
                        }`}
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: ACTIVE FILTER CONTEXT & SEARCH */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#073F2E] text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#171915]">
              Attendees for:{" "}
              <span className="font-serif lowercase capitalize text-[#073F2E]">
                {activeEvent ? activeEvent.title : "All Event Sessions"}
              </span>
            </h2>
          </div>

          {activeEvent && (
            <button
              onClick={() => setSelectedEventId("all")}
              className="text-xs font-semibold text-[#77776F] hover:text-[#073F2E] underline cursor-pointer"
            >
              Clear Event Filter (Show All)
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              placeholder="Search attendee name, email, or booking ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] text-xs text-[#171915] placeholder-[#77776F] focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-[#77776F] absolute left-3 top-2.5" />
          </form>

          {/* Event Quick Select Dropdown */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full md:w-56 pl-3 pr-8 py-2 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] text-xs text-[#171915] font-medium focus:outline-none focus:border-[#073F2E] cursor-pointer appearance-none truncate"
            >
              <option value="all">All Events ({events.length})</option>
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-[#77776F] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Status Select */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-36 pl-3 pr-8 py-2 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] text-xs text-[#171915] font-medium focus:outline-none focus:border-[#073F2E] cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending Payment</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-[#77776F] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={fetchBookings}
            className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold shadow-xs shrink-0 cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* SECTION 3: ATTENDEES TABLE */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#77776F]">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#073F2E] mb-3" />
            <p className="text-xs font-medium">Loading attendee registry...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E7E2D8] bg-[#FAF8F5]/80 text-[#77776F] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5 font-bold">Booking Ref</th>
                  <th className="py-3.5 px-4 font-bold">Attendee</th>
                  {selectedEventId === "all" && (
                    <th className="py-3.5 px-4 font-bold">Event Title</th>
                  )}
                  <th className="py-3.5 px-4 font-bold text-center">Seats</th>
                  <th className="py-3.5 px-4 font-bold">Total Paid</th>
                  <th className="py-3.5 px-4 font-bold">Booking Status</th>
                  <th className="py-3.5 px-4 font-bold">Payment</th>
                  <th className="py-3.5 px-5 font-bold text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D8]/70">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Booking Reference */}
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-[#073F2E] bg-[#FAF8F5] border border-[#E7E2D8] px-2 py-0.5 rounded-md text-[11px]">
                        {b.bookingRef}
                      </span>
                    </td>

                    {/* Attendee */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#171915]">{b.attendeeName}</div>
                      <div className="text-[11px] text-[#77776F] truncate">{b.attendeeEmail}</div>
                    </td>

                    {/* Event (only shown if All Events is active) */}
                    {selectedEventId === "all" && (
                      <td className="py-4 px-4 max-w-xs truncate font-medium text-[#171915]">
                        <button
                          type="button"
                          onClick={() => {
                            const eId = (b.event?._id || b.event)?.toString();
                            if (eId) setSelectedEventId(eId);
                          }}
                          className="hover:text-[#073F2E] hover:underline text-left cursor-pointer"
                          title="Click to view only this event's attendees"
                        >
                          {b.event?.title || "Event details unavailable"}
                        </button>
                      </td>
                    )}

                    {/* Seats */}
                    <td className="py-4 px-4 text-center font-bold text-[#171915]">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E2D8] text-xs">
                        {b.seatsBooked} {b.seatsBooked === 1 ? "seat" : "seats"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-serif text-sm font-bold text-[#171915]">
                      {b.amount === 0 ? "Free" : `₹${b.amount?.toLocaleString("en-IN")}`}
                    </td>

                    {/* Booking Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          b.bookingStatus === "confirmed"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                            : b.bookingStatus === "cancelled"
                            ? "bg-gray-100 text-gray-700 border border-gray-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200/80"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.bookingStatus === "confirmed" ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                        />
                        {b.bookingStatus}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          b.paymentStatus === "completed"
                            ? "bg-emerald-100/70 text-emerald-800"
                            : b.paymentStatus === "free"
                            ? "bg-blue-50 text-blue-800 border border-blue-200/60"
                            : "bg-amber-100/70 text-amber-800"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-right text-[#77776F] whitespace-nowrap text-[11px]">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[#77776F]">
            <p className="text-sm font-medium">
              No attendees found {activeEvent ? `for "${activeEvent.title}"` : "matching criteria"}.
            </p>
            <p className="text-xs text-[#77776F]/80 mt-1">
              Try selecting another event session above or clearing filters.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
