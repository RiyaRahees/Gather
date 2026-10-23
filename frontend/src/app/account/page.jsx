"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TicketModal from "@/components/tickets/TicketModal";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Shield,
  QrCode,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, isAdmin, userToken, token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelBookingState, setCancelBookingState] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Helper for authentication headers
  const getAuthHeaders = () => {
    const activeToken =
      userToken ||
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("usertoken") || localStorage.getItem("token")
        : null);
    return activeToken
      ? {
          "x-user-token": activeToken,
          Authorization: `Bearer ${activeToken}`,
        }
      : {};
  };

  // Digital Ticket Viewing State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTickets, setActiveTickets] = useState([]);

  const handleOpenTicket = async (booking) => {
    setSelectedBooking(booking);
    setTicketModalOpen(true);
    setTicketsLoading(true);
    setActiveTickets([]);
    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch(`/api/tickets/booking/${booking._id}`, {
        headers: authHeaders,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/account");
    } else if (user) {
      if (user.role === "admin" || user.email === "admin@gmail.com") {
        router.push("/admin/dashboard");
      } else {
        fetchUserBookings();
      }
    }
  }, [user, authLoading, router]);

  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch("/api/bookings/my", {
        headers: authHeaders,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load user bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const confirmCancelBooking = async () => {
    if (!cancelBookingState) return;

    const { bookingId, bookingRef } = cancelBookingState;
    setCancellingId(bookingId);
    setMessage("");
    setError("");

    try {
      const authHeaders = getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
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

      setMessage(`Booking #${bookingRef} cancelled successfully. Seats restored.`);
      fetchUserBookings();
    } catch (err) {
      setError(err.message || "Cancellation error");
    } finally {
      setCancellingId(null);
      setCancelBookingState(null);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F4ED]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#171915]">
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">
          
          {/* Account Profile Header */}
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 sm:p-8 shadow-sm flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#073F2E] text-[#A9C3A0] flex items-center justify-center text-xl font-bold font-serif">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#171915]">{user.name}</h1>
                </div>
                <p className="text-xs sm:text-sm text-[#77776F] mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {message && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bookings Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1">
                  YOUR RESERVATIONS
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#171915]">
                  My Passes & Bookings
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/account/bookings?claimWaitlist=true"
                  className="btn-secondary px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#073F2E]" />
                  <span>View Waitlist & Passes</span>
                </Link>
                <Link
                  href="/events"
                  className="btn-forest px-4 py-2 rounded-full text-xs font-semibold hidden sm:inline-flex items-center gap-1.5"
                >
                  <span>Browse more workshops</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {loadingBookings ? (
              <div className="py-16 text-center text-[#77776F] flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#073F2E]" />
                <p className="text-xs">Loading your passes...</p>
              </div>
            ) : bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((b) => {
                  const evt = b.event;
                  const isCancelled = b.bookingStatus === "cancelled";
                  const isConfirmed = b.bookingStatus === "confirmed";

                  return (
                    <div
                      key={b._id}
                      className={`bg-white rounded-3xl border ${
                        isCancelled ? "border-gray-200 opacity-60" : "border-[#E7E2D8] shadow-sm"
                      } p-6 flex flex-col justify-between space-y-4`}
                    >
                      <div>
                        {/* Top Meta Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D8]/60">
                          <span className="text-[11px] font-bold font-mono tracking-wider text-[#073F2E] bg-[#EBF3E8] px-2.5 py-1 rounded-md">
                            {b.bookingRef}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              isConfirmed
                                ? "bg-emerald-100 text-emerald-800"
                                : isCancelled
                                ? "bg-gray-100 text-gray-600"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </div>

                        {/* Event Title */}
                        <h3 className="font-serif text-lg font-bold text-[#171915] mt-3">
                          {evt ? evt.title : "Event Details Unavailable"}
                        </h3>

                        {/* Venue & Date */}
                        {evt && (
                          <div className="text-xs text-[#77776F] space-y-1.5 mt-2.5">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#073F2E]" />
                              <span>{evt.date} • {evt.time}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#073F2E]" />
                              <span>{evt.venue}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Attendee Details & Pricing */}
                      <div className="pt-3 border-t border-[#E7E2D8]/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[#77776F] block">Reserved for:</span>
                          <span className="font-semibold text-[#171915]">
                            {b.attendeeName} ({b.seatsBooked} {b.seatsBooked === 1 ? "seat" : "seats"})
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[#77776F] block">Payment:</span>
                          <span className="font-bold text-[#171915]">
                            {b.amount === 0 ? "Free" : `₹${b.amount} (${b.paymentStatus})`}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions: View Ticket and Cancel */}
                      <div className="pt-3 border-t border-[#E7E2D8]/60 flex items-center justify-between gap-2">
                        {isConfirmed && (b.amount === 0 || b.paymentStatus === "completed") ? (
                          <button
                            type="button"
                            onClick={() => handleOpenTicket(b)}
                            className="btn-forest px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Ticket</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-[#77776F] italic">
                            {isCancelled ? "Reservation voided" : "Ticket pending payment"}
                          </div>
                        )}

                        {isConfirmed && (
                          <button
                            type="button"
                            disabled={cancellingId === b._id}
                            onClick={() =>
                              setCancelBookingState({
                                bookingId: b._id,
                                bookingRef: b.bookingRef,
                                title: b.event?.title,
                              })
                            }
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline disabled:opacity-50 cursor-pointer"
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
              <div className="bg-white rounded-3xl border border-[#E7E2D8] p-12 text-center max-w-lg mx-auto space-y-4">
                <Ticket className="w-12 h-12 text-[#A9C3A0] mx-auto" />
                <h3 className="font-serif text-xl font-bold text-[#171915]">No Active Registrations</h3>
                <p className="text-xs text-[#77776F] max-w-sm mx-auto leading-relaxed">
                  You haven&apos;t reserved seats for any upcoming workshops yet. Explore the catalogue and secure your pass.
                </p>
                <Link
                  href="/events"
                  className="btn-forest px-6 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                >
                  <span>Explore workshops</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />

      {/* Digital Pass Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        booking={selectedBooking}
        tickets={activeTickets}
        loading={ticketsLoading}
      />

      {/* Modern Cancellation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelBookingState)}
        title="Cancel Reservation?"
        description={
          <>
            Are you sure you want to cancel booking{" "}
            <span className="font-semibold text-[#171915]">
              #{cancelBookingState?.bookingRef}
            </span>
            {cancelBookingState?.title ? ` for "${cancelBookingState.title}"` : ""}? Your reserved seat(s) will be restored to the public catalogue pool.
          </>
        }
        confirmText="Cancel Reservation"
        cancelText="Keep Reservation"
        variant="warning"
        loading={Boolean(cancellingId)}
        onConfirm={confirmCancelBooking}
        onClose={() => !cancellingId && setCancelBookingState(null)}
      />
    </div>
  );
}
