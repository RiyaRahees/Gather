"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TicketModal from "@/components/tickets/TicketModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Ticket,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  ArrowLeft,
  XCircle,
  Bell,
  Sparkles,
  Timer,
  AlertTriangle,
} from "lucide-react";

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("claimWaitlist");
  const { user, loading: authLoading, userToken, token } = useAuth();

  const [activeTab, setActiveTab] = useState(initialToken ? "waitlist" : "bookings"); // "bookings" | "waitlist"
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Ticket viewing state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTickets, setActiveTickets] = useState([]);

  // Cancellation state
  const [cancelState, setCancelState] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Waitlist leave / claim state
  const [leaveWaitlistState, setLeaveWaitlistState] = useState(null);
  const [leavingWaitlist, setLeavingWaitlist] = useState(false);
  const [claimingWaitlistId, setClaimingWaitlistId] = useState(null);

  // Live countdown state for offered entries (stored as seconds remaining per waitlist id)
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/account/bookings");
    } else if (user) {
      if (user.role === "admin" || user.email === "admin@gmail.com") {
        router.push("/admin/dashboard");
      } else {
        fetchAllData();
      }
    }
  }, [user, authLoading, router]);

  // Set up second-by-second countdown ticker for any OFFERED waitlist entries
  useEffect(() => {
    const offeredEntries = waitlist.filter((w) => w.status === "OFFERED" && w.offerExpiresAt);
    if (offeredEntries.length === 0) return;

    const tick = () => {
      const now = Date.now();
      const updated = {};
      let hasNewlyExpired = false;

      offeredEntries.forEach((entry) => {
        const expiresAt = new Date(entry.offerExpiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        updated[entry._id] = diff;
        if (diff <= 0 && countdowns[entry._id] > 0) {
          hasNewlyExpired = true;
        }
      });

      setCountdowns(updated);
      if (hasNewlyExpired) {
        fetchWaitlist();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [waitlist]);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchBookings(), fetchWaitlist()]);
    setLoading(false);
  };

  const fetchBookings = async () => {
    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch("/api/bookings/my", {
        headers: authHeaders,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Unable to load bookings.");
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your confirmed bookings.");
    }
  };

  const fetchWaitlist = async () => {
    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch("/api/waitlist/my", {
        headers: authHeaders,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setWaitlist(data.waitlist || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTicket = async (booking) => {
    setSelectedBooking(booking);
    setTicketModalOpen(true);
    setTicketsLoading(true);
    setActiveTickets([]);

    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch(`/api/tickets/booking/${booking._id}`, {
        headers: authHeaders,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load digital pass.");
      }
      const data = await res.json();
      setActiveTickets(data.tickets || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelState) return;
    setCancelling(true);
    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch(`/api/bookings/${cancelState.bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }
      setFeedbackMessage(`Booking #${cancelState.bookingRef} cancelled. Seats returned to catalogue.`);
      fetchBookings();
      fetchWaitlist();
    } catch (err) {
      setError(err.message || "Failed to cancel reservation");
    } finally {
      setCancelling(false);
      setCancelState(null);
    }
  };

  // --- LEAVE WAITLIST ---
  const handleConfirmLeaveWaitlist = async () => {
    if (!leaveWaitlistState) return;
    setLeavingWaitlist(true);
    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch(`/api/waitlist/${leaveWaitlistState._id}/leave`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to leave waitlist.");
      }

      setFeedbackMessage("You have left the waitlist for " + (leaveWaitlistState.event?.title || "the event") + ".");
      fetchWaitlist();
    } catch (err) {
      setError(err.message || "Failed to leave waitlist.");
    } finally {
      setLeavingWaitlist(false);
      setLeaveWaitlistState(null);
    }
  };

  // --- CLAIM OFFERED SEAT ---
  const handleClaimOffer = async (entry) => {
    setClaimingWaitlistId(entry._id);
    setError("");

    const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    const authHeaders = activeToken
      ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
      : {};

    const evt = entry.event;
    const isFree = !evt?.price || evt.price === 0;

    try {
      // 1. FREE EVENT CLAIM
      if (isFree) {
        const res = await fetch("/api/waitlist/claim/free", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          credentials: "include",
          body: JSON.stringify({
            waitlistId: entry._id,
            offerToken: entry.offerToken,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to claim free pass.");
        }
        setFeedbackMessage("🎉 Seat confirmed! Your digital admission pass has been issued.");
        await fetchAllData();
        setActiveTab("bookings");
        return;
      }

      // 2. PAID EVENT CLAIM VIA RAZORPAY
      const initRes = await fetch("/api/waitlist/claim/initiate-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify({
          waitlistId: entry._id,
          offerToken: entry.offerToken,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || "Failed to initiate payment checkout.");
      }

      const { razorpayOrder, bookingId } = initData;

      if (
        razorpayOrder.isSimulated ||
        !razorpayOrder.key ||
        razorpayOrder.key.includes("placeholder") ||
        typeof window.Razorpay === "undefined"
      ) {
        const simRes = await fetch("/api/waitlist/claim/verify-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          credentials: "include",
          body: JSON.stringify({
            waitlistId: entry._id,
            bookingId,
            razorpayOrderId: razorpayOrder.id,
            razorpayPaymentId: `pay_sim_${Date.now()}`,
            razorpaySignature: "simulated_signature",
          }),
        });
        const simData = await simRes.json();
        if (simRes.ok) {
          setFeedbackMessage("🎉 Payment verified and pass confirmed via waitlist!");
          await fetchAllData();
          setActiveTab("bookings");
        } else {
          setError(simData.error || "Payment verification failed.");
        }
        return;
      }

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Gather",
        description: `Waitlist Claim: ${evt.title}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: entry.attendeeName,
          email: entry.attendeeEmail,
        },
        theme: { color: "#073F2E" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/waitlist/claim/verify-paid", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              credentials: "include",
              body: JSON.stringify({
                waitlistId: entry._id,
                bookingId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setFeedbackMessage("🎉 Payment verified! Your seat has been secured.");
              await fetchAllData();
              setActiveTab("bookings");
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch {
            setError("Failed to verify payment with server.");
          }
        },
        modal: {
          ondismiss: function () {
            setClaimingWaitlistId(null);
            setError("Payment checkout was cancelled. Your seat offer remains active until expiry.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || "Failed to process seat claim.");
    } finally {
      setClaimingWaitlistId(null);
    }
  };

  const formatSeconds = (totalSeconds) => {
    if (totalSeconds <= 0) return "Offer Expired";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F4ED]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
        </div>
        <Footer />
      </div>
    );
  }

  const offeredCount = waitlist.filter((w) => w.status === "OFFERED").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#171915]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Top Breadcrumb & Heading */}
          <div className="space-y-3">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77776F] hover:text-[#073F2E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Account Overview</span>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1">
                  OFFICIAL ADMISSIONS &amp; WAITLIST
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#171915]">
                  My Passes &amp; Waitlist
                </h1>
                <p className="text-xs sm:text-sm text-[#77776F] mt-1 max-w-xl">
                  Manage your confirmed admission passes, check-in QR codes, and real-time waitlist queue positions.
                </p>
              </div>

              <Link
                href="/events"
                className="btn-forest px-5 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Browse More Sessions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Subnavigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 border-b border-[#E7E2D8] pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-bold uppercase tracking-wider rounded-t-2xl whitespace-nowrap transition-all relative ${
                activeTab === "bookings"
                  ? "bg-white text-[#073F2E] border-t-2 border-x border-[#E7E2D8] -mb-1.5 shadow-xs"
                  : "text-[#77776F] hover:text-[#171915]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span>Confirmed Passes ({bookings.length})</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("waitlist")}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-2xl transition-all relative ${
                activeTab === "waitlist"
                  ? "bg-white text-[#073F2E] border-t-2 border-x border-[#E7E2D8] -mb-1.5 shadow-xs"
                  : "text-[#77776F] hover:text-[#171915]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Waitlist Passes ({waitlist.length})</span>
                {offeredCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C2A265] text-[#073F2E] font-extrabold text-[10px] animate-pulse">
                    {offeredCount} Action Required
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Feedback Messages */}
          {feedbackMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CONFIRMED BOOKINGS */}
          {activeTab === "bookings" && (
            <div>
              {loading ? (
                <div className="py-24 text-center text-[#77776F] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
                  <p className="text-xs font-medium">Retrieving your passes...</p>
                </div>
              ) : bookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {bookings.map((b) => {
                    const evt = b.event;
                    const isConfirmed = b.bookingStatus === "confirmed";
                    const isCancelled = b.bookingStatus === "cancelled";
                    const isPaid = b.amount > 0;
                    const isEligibleForTicket =
                      isConfirmed && (!isPaid || b.paymentStatus === "completed");

                    const coverImage = evt?.image || "/images/event-design-studio.jpg";

                    return (
                      <div
                        key={b._id}
                        className={`bg-white rounded-3xl border ${
                          isCancelled ? "border-gray-200 opacity-60" : "border-[#E7E2D8] shadow-sm"
                        } overflow-hidden flex flex-col justify-between transition-all hover:shadow-md`}
                      >
                        <div>
                          {/* Top Banner / Event Cover */}
                          <div className="relative h-44 sm:h-48 w-full bg-[#073F2E]/10 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coverImage}
                              alt={evt?.title || "Event Cover"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Top Reference Pill & Status */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                {b.bookingRef}
                              </span>

                              <div className="flex items-center gap-2">
                                {isConfirmed ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#EBF3E8] text-[#073F2E] border border-[#A9C3A0]/60 shadow-xs flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Confirmed
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600 border border-gray-300">
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title on image banner */}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-[#EBF3E8] block mb-0.5">
                                {evt?.category || "Workshop"}
                              </span>
                              <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm">
                                {evt?.title || "Gather Curated Masterclass"}
                              </h3>
                            </div>
                          </div>

                          {/* Middle Metadata Details */}
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#77776F]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#073F2E]" />
                                <span>{evt?.date || "Date scheduled"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#073F2E]" />
                                <span>{evt?.time || "Time scheduled"}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <MapPin className="w-4 h-4 text-[#073F2E] flex-shrink-0" />
                                <span className="truncate">{evt?.venue || "Fort Kochi Studio"}</span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[#77776F] block">Reserved For</span>
                                <span className="font-bold text-[#171915]">
                                  {b.attendeeName} ({b.seatsBooked} {b.seatsBooked === 1 ? "seat" : "seats"})
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#77776F] block">Payment</span>
                                <span className="font-bold text-[#073F2E]">
                                  {b.amount === 0 ? "Free Pass" : `₹${b.amount} (${b.paymentStatus})`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E7E2D8] flex items-center justify-between gap-3">
                          {isEligibleForTicket ? (
                            <button
                              onClick={() => handleOpenTicket(b)}
                              className="btn-forest px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>View QR Pass</span>
                            </button>
                          ) : (
                            <span className="text-xs text-[#77776F] italic">No active pass</span>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() =>
                                setCancelState({
                                  bookingId: b._id,
                                  bookingRef: b.bookingRef,
                                  eventTitle: evt?.title || "this event",
                                })
                              }
                              className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
                            >
                              Cancel Reservation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E7E2D8] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center mx-auto">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#171915]">No Confirmed Passes Yet</h3>
                  <p className="text-xs sm:text-sm text-[#77776F]">
                    Explore our curated catalogue of masterclasses, workshops, and gatherings to reserve your first seat.
                  </p>
                  <Link href="/events" className="btn-forest px-6 py-3 rounded-full text-xs font-semibold inline-block">
                    Explore Gather Catalogue
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WAITLIST PASSES */}
          {activeTab === "waitlist" && (
            <div>
              {loading ? (
                <div className="py-24 text-center text-[#77776F] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
                  <p className="text-xs font-medium">Checking waitlist queues...</p>
                </div>
              ) : waitlist.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {waitlist.map((w) => {
                    const evt = w.event;
                    const isOffered = w.status === "OFFERED";
                    const isWaiting = w.status === "WAITING";
                    const isConfirmed = w.status === "CONFIRMED";
                    const isExpired = w.status === "EXPIRED";
                    const isCancelled = w.status === "CANCELLED" || w.status === "REMOVED";

                    const secondsLeft = countdowns[w._id] || 0;
                    const coverImage = evt?.image || "/images/event-design-studio.jpg";

                    return (
                      <div
                        key={w._id}
                        className={`bg-white rounded-3xl border ${
                          isOffered
                            ? "border-2 border-[#ECC968] shadow-md bg-gradient-to-b from-[#FFFDF0]/60 to-white"
                            : isCancelled || isExpired
                            ? "border-gray-200 opacity-60"
                            : "border-[#E7E2D8] shadow-sm"
                        } overflow-hidden flex flex-col justify-between transition-all`}
                      >
                        <div>
                          {/* Banner */}
                          <div className="relative h-44 sm:h-48 w-full bg-[#073F2E]/10 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coverImage}
                              alt={evt?.title || "Event Cover"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Status Badge */}
                            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                {isWaiting ? `Queue #${w.queuePosition || 1}` : "Waitlist"}
                              </span>

                              {isOffered ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#C2A265] text-[#073F2E] border border-amber-300 shadow-sm flex items-center gap-1.5 animate-pulse">
                                  <Sparkles className="w-3 h-3" />
                                  Seat Offered!
                                </span>
                              ) : isWaiting ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#EBF3E8] text-[#073F2E] border border-[#A9C3A0]/60 shadow-xs flex items-center gap-1">
                                  <Bell className="w-3 h-3" />
                                  Waiting in Queue
                                </span>
                              ) : isConfirmed ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Promoted &amp; Confirmed
                                </span>
                              ) : isExpired ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                  Offer Expired
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600 border border-gray-300">
                                  Cancelled
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-[#EBF3E8] block mb-0.5">
                                {evt?.category || "Workshop"}
                              </span>
                              <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm">
                                {evt?.title || "Gather Curated Masterclass"}
                              </h3>
                            </div>
                          </div>

                          {/* Middle Details */}
                          <div className="p-6 space-y-4">
                            {/* Urgent Countdown for Offered Entry */}
                            {isOffered && (
                              <div className="bg-[#FFFDF0] border border-[#ECC968] rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-[#ECC968]/30 text-[#8C4A00] flex items-center justify-center">
                                    <Timer className="w-5 h-5 animate-spin" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4A00] block">
                                      Exclusive Window
                                    </span>
                                    <span className="font-mono font-bold text-sm text-[#8C4A00]">
                                      {formatSeconds(secondsLeft)}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-[#77776F] max-w-[140px] text-right">
                                  Accept within 2 hours or seat passes to next in line.
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#77776F]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#073F2E]" />
                                <span>{evt?.date || "Date scheduled"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#073F2E]" />
                                <span>{evt?.time || "Time scheduled"}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <MapPin className="w-4 h-4 text-[#073F2E] flex-shrink-0" />
                                <span className="truncate">{evt?.venue || "Fort Kochi Studio"}</span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[#77776F] block">Waitlisted Attendee</span>
                                <span className="font-bold text-[#171915]">
                                  {w.attendeeName} ({w.attendeeEmail})
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#77776F] block">Price</span>
                                <span className="font-bold text-[#073F2E]">
                                  {evt?.price === 0 ? "Free Pass" : `₹${evt?.price || 0}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E7E2D8] flex items-center justify-between gap-3">
                          {isOffered ? (
                            <>
                              <button
                                onClick={() => handleClaimOffer(w)}
                                disabled={claimingWaitlistId === w._id || secondsLeft <= 0}
                                className="btn-forest px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-md"
                              >
                                {claimingWaitlistId === w._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 text-[#C2A265]" />
                                    <span>Claim Seat Now ({evt?.price === 0 ? "Free" : `₹${evt?.price}`})</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => setLeaveWaitlistState(w)}
                                disabled={claimingWaitlistId === w._id}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold"
                              >
                                Decline
                              </button>
                            </>
                          ) : isWaiting ? (
                            <>
                              <span className="text-xs text-[#073F2E] font-medium flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#073F2E] animate-pulse"></span>
                                Position #{w.queuePosition || 1} in priority queue
                              </span>

                              <button
                                onClick={() => setLeaveWaitlistState(w)}
                                className="text-xs text-[#77776F] hover:text-red-700 font-semibold transition-colors"
                              >
                                Leave Waitlist
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/events/${evt?._id}`}
                              className="text-xs text-[#073F2E] font-semibold hover:underline"
                            >
                              View Session &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E7E2D8] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center mx-auto">
                    <Bell className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#171915]">No Active Waitlist Entries</h3>
                  <p className="text-xs sm:text-sm text-[#77776F]">
                    When a session is sold out, you can join its waitlist to be automatically notified and offered a seat whenever someone cancels.
                  </p>
                  <Link href="/events" className="btn-forest px-6 py-3 rounded-full text-xs font-semibold inline-block">
                    Explore Gather Catalogue
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Cancel Booking Modal */}
      <ConfirmDialog
        isOpen={Boolean(cancelState)}
        title="Cancel Your Reservation?"
        description={`Are you sure you want to cancel booking #${cancelState?.bookingRef} for "${cancelState?.eventTitle}"? Your seat will be returned to the catalogue or offered to the next waitlisted attendee.`}
        confirmText="Yes, Cancel Booking"
        cancelText="Keep My Reservation"
        variant="danger"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setCancelState(null)}
      />

      {/* Leave Waitlist Modal */}
      <ConfirmDialog
        isOpen={Boolean(leaveWaitlistState)}
        title="Leave Waitlist Queue?"
        description={
          leaveWaitlistState?.status === "OFFERED"
            ? "You currently have an active reserved seat offer! If you leave, this seat will immediately be offered to the next attendee in line."
            : "Are you sure you want to leave the waitlist? You will lose your current priority position in line."
        }
        confirmText="Leave Waitlist"
        cancelText="Keep My Spot"
        variant="warning"
        loading={leavingWaitlist}
        onConfirm={handleConfirmLeaveWaitlist}
        onClose={() => setLeaveWaitlistState(null)}
      />

      {/* Digital QR Ticket Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        booking={selectedBooking}
        tickets={activeTickets}
        loading={ticketsLoading}
      />

      <Footer />
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F4ED]">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
        </div>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
