"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  ArrowRight,
  ArrowLeft,
  Mail,
  ShieldAlert,
} from "lucide-react";

function CancelBookingContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");
  const ref = searchParams.get("ref");

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  // Fetch booking cancellation preview info
  useEffect(() => {
    if (!token && !ref && !id) {
      setError("No cancellation link parameters detected. Please open the link sent to your email.");
      setLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (id) params.set("id", id);
        if (token) params.set("token", token);
        if (ref) params.set("ref", ref);

        const res = await fetch(`/api/bookings/cancel-info?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to retrieve reservation details.");
        }

        setBooking(data);
        if (data.bookingStatus === "cancelled") {
          setCancelled(true);
        }
      } catch (err) {
        setError(err.message || "Failed to load reservation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [id, token, ref]);

  // Handle cancellation action
  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      setError("");

      const res = await fetch("/api/bookings/cancel-by-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking?.bookingId || id,
          token: token || booking?.bookingRef || ref,
          ref: booking?.bookingRef || ref,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel your reservation.");
      }

      setCancelled(true);
    } catch (err) {
      setError(err.message || "Cancellation failed. Please try again or contact support.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#171915] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col justify-center">
        {/* Loading State */}
        {loading && (
          <div className="bg-[#FFFEFA] border border-[#EAE6DF] rounded-3xl p-12 text-center shadow-xs">
            <Loader2 className="w-10 h-10 animate-spin text-[#073F2E] mx-auto mb-4" />
            <h2 className="text-xl font-serif text-[#171915]">Retrieving Your Reservation...</h2>
            <p className="text-sm text-[#77776F] mt-2">Checking ticket security credentials and status.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-[#FFFEFA] border border-[#FECDD3] rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center mx-auto mb-6 text-[#BE123C]">
              <XCircle className="w-8 h-8" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-[#BE123C] uppercase">
              Action Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#171915] mt-2 mb-3">
              Unable to Process Cancellation
            </h1>
            <p className="text-sm text-[#77776F] max-w-md mx-auto leading-relaxed mb-8">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/account/bookings"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#073F2E] text-white text-sm font-semibold hover:bg-[#0A4D39] transition-colors"
              >
                Sign In to My Bookings
              </Link>
              <Link
                href="/events"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5D0C6] text-[#171915] text-sm font-semibold hover:bg-[#F3EFE6] transition-colors"
              >
                Browse All Sessions
              </Link>
            </div>
          </div>
        )}

        {/* Success / Already Cancelled State */}
        {!loading && !error && cancelled && (
          <div className="bg-[#FFFEFA] border border-[#EAE6DF] rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF5EE] border border-[#C5E4D1] flex items-center justify-center mx-auto mb-6 text-[#15803D]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-[#15803D] uppercase">
              Status Updated
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#171915] mt-2 mb-3">
              Reservation Has Been Cancelled
            </h1>
            <p className="text-sm text-[#77776F] max-w-md mx-auto leading-relaxed mb-6">
              Your reservation reference <strong className="text-[#171915] font-mono">{booking?.bookingRef || ref}</strong> has been cancelled. 
              Seats have been returned to the event capacity and all issued QR passes are voided.
            </p>

            <div className="bg-[#F8F6F0] border border-[#EAE6DF] rounded-2xl p-4 max-w-md mx-auto text-left mb-8 flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#073F2E] shrink-0 mt-0.5" />
              <div className="text-xs text-[#77776F]">
                <strong className="text-[#171915] block mb-0.5">Confirmation Email Dispatched</strong>
                A cancellation summary and void notice have been delivered to{" "}
                <span className="font-semibold text-[#171915]">{booking?.attendeeEmail || "your email"}</span>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/events"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#073F2E] text-white text-sm font-semibold hover:bg-[#0A4D39] transition-colors"
              >
                Explore Upcoming Sessions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5D0C6] text-[#171915] text-sm font-semibold hover:bg-[#F3EFE6] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Confirmation Screen */}
        {!loading && !error && !cancelled && booking && (
          <div className="bg-[#FFFEFA] border border-[#EAE6DF] rounded-3xl overflow-hidden shadow-xs">
            {/* Header banner */}
            <div className="bg-[#4B1A1A] p-6 sm:p-8 text-white relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-rose-200 tracking-wide mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                Cancel Reservation
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
                Confirm Cancellation
              </h1>
              <p className="text-sm text-rose-200 mt-2 max-w-xl">
                Please review your reservation details below before confirming. Once cancelled, your seats will be released immediately.
              </p>
            </div>

            {/* Event & Booking details */}
            <div className="p-6 sm:p-8">
              <div className="bg-[#F8F6F0] border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE6DF]">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#77776F] block mb-1">
                      Event Session
                    </span>
                    <h2 className="text-lg font-serif font-bold text-[#171915]">
                      {booking.event?.title}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#77776F] block mb-1">
                      Reference
                    </span>
                    <span className="font-mono font-bold text-sm bg-white border border-[#E0DCD3] px-3 py-1 rounded-lg text-[#073F2E]">
                      {booking.bookingRef}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-[#77776F]">
                    <Calendar className="w-4 h-4 text-[#073F2E] shrink-0" />
                    <span>{booking.event?.date || "Date scheduled"}</span>
                  </div>
                  {booking.event?.time && (
                    <div className="flex items-center gap-2 text-[#77776F]">
                      <Clock className="w-4 h-4 text-[#073F2E] shrink-0" />
                      <span>{booking.event.time}</span>
                    </div>
                  )}
                  {booking.event?.venue && (
                    <div className="flex items-center gap-2 text-[#77776F]">
                      <MapPin className="w-4 h-4 text-[#073F2E] shrink-0" />
                      <span className="truncate">{booking.event.venue}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3 text-xs text-[#77776F]">
                  <div>
                    Reserved for: <strong className="text-[#171915]">{booking.attendeeName}</strong> ({booking.attendeeEmail})
                  </div>
                  <div className="font-semibold text-[#073F2E]">
                    {booking.seatsBooked} {booking.seatsBooked === 1 ? "Seat" : "Seats"} Reserved
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5">
                <ShieldAlert className="w-5 h-5 text-[#BE123C] shrink-0 mt-0.5" />
                <div className="text-xs text-[#9F1239] leading-relaxed">
                  <strong className="block text-sm font-semibold mb-1">
                    What happens when you cancel:
                  </strong>
                  &bull; Your {booking.seatsBooked} {booking.seatsBooked === 1 ? "seat" : "seats"} will be instantly returned to public availability or offered to the earliest person on the waitlist.<br />
                  &bull; Any generated QR code admission passes will be marked void and denied entry at check-in.<br />
                  &bull; A cancellation receipt will be dispatched to <strong className="text-[#881337]">{booking.attendeeEmail}</strong>.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
                <Link
                  href="/events"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-[#D5D0C6] text-xs sm:text-sm font-semibold text-[#171915] hover:bg-[#F3EFE6] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Keep My Reservation
                </Link>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#DC2626] text-white text-xs sm:text-sm font-bold tracking-wide hover:bg-[#B91C1C] transition-all disabled:opacity-50 shadow-md shadow-rose-900/10"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling Reservation...
                    </>
                  ) : (
                    <>
                      Confirm &amp; Cancel Reservation &rarr;
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CancelBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
        </div>
      }
    >
      <CancelBookingContent />
    </Suspense>
  );
}
