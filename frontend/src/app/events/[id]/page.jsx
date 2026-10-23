"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PriceTag from "@/components/common/PriceTag";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TicketModal from "@/components/tickets/TicketModal";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Loader2,
  IndianRupee,
  Bell,
  XCircle,
  AlertTriangle,
  Ticket,
  QrCode,
  Download,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

// Resilient fetch helper with automatic single retry for proxy socket resets/idle keepalive drops
async function resilientFetch(url, options = {}, maxRetries = 1) {
  let lastError = null;
  const targetUrl = getApiUrl(url);
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(targetUrl, options);
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || "Server returned an unexpected response." };
      }

      // If Next.js proxy rewrite or server returned 500/502/503/504 and we have retries left
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
    }
  }
  throw lastError || new Error("Connection error. Please try again.");
}

function formatOrdinal(n) {
  const num = parseInt(n, 10) || 1;
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  const words = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
  const word = words[num] || `${num}${suffix}`;
  return {
    num,
    suffix,
    ordinal: `${num}${suffix}`,
    word,
    label: `${num}${suffix} in line (${word})`,
  };
}

export default function EventDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user, userToken, token } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking Form State
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [confirmedTickets, setConfirmedTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [toast, setToast] = useState(null);

  // Existing User Booking (Already Booked) State
  const [existingBooking, setExistingBooking] = useState(null);
  const [existingTickets, setExistingTickets] = useState([]);
  const [loadingExistingBooking, setLoadingExistingBooking] = useState(false);

  const [seatDropdownOpen, setSeatDropdownOpen] = useState(false);
  const seatDropdownRef = useRef(null);

  // Close custom seat dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (seatDropdownRef.current && !seatDropdownRef.current.contains(event.target)) {
        setSeatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss top-right toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // When a booking completes, fetch its issued tickets to get high-res QR codes
  useEffect(() => {
    if (bookingSuccess) {
      const bId = bookingSuccess.id || bookingSuccess._id;
      if (bId) {
        setLoadingTickets(true);
        const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
        const authHeaders = activeToken
          ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
          : {};
        fetch(`/api/tickets/booking/${bId}`, {
          headers: authHeaders,
          credentials: "include",
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.tickets && data.tickets.length > 0) {
              setConfirmedTickets(data.tickets);
            }
          })
          .catch((err) => console.error("Could not fetch tickets for booking:", err))
          .finally(() => setLoadingTickets(false));
      }
    } else {
      setConfirmedTickets([]);
    }
  }, [bookingSuccess]);

  // Waitlist State
  const [waitlistSummary, setWaitlistSummary] = useState({
    activeCount: 0,
    maxCapacity: 10,
    isWaitlistFull: false,
    userEntry: null,
  });
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistActionLoading, setWaitlistActionLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistError, setWaitlistError] = useState("");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const checkUserExistingBooking = async () => {
    if (!user) {
      setExistingBooking(null);
      setExistingTickets([]);
      return;
    }
    try {
      setLoadingExistingBooking(true);
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch("/api/bookings/my", {
        headers: authHeaders,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const targetId = (event?._id || event?.id || id)?.toString();
        const targetSlug = event?.slug || id;

        const match = (data.bookings || []).find((b) => {
          if (b.bookingStatus !== "confirmed") return false;
          const bEvtId = (b.event?._id || b.event?.id || b.event)?.toString();
          const bEvtSlug = b.event?.slug;
          return (
            (bEvtId && (bEvtId === targetId || bEvtId === id)) ||
            (bEvtSlug && (bEvtSlug === targetSlug || bEvtSlug === id))
          );
        });

        if (match) {
          setExistingBooking(match);
          const bId = match._id || match.id;
          if (bId) {
            const tRes = await fetch(`/api/tickets/booking/${bId}`, {
              headers: authHeaders,
              credentials: "include",
            });
            if (tRes.ok) {
              const tData = await tRes.json();
              if (tData.tickets && tData.tickets.length > 0) {
                setExistingTickets(tData.tickets);
              }
            }
          }
        } else {
          setExistingBooking(null);
          setExistingTickets([]);
        }
      }
    } catch (err) {
      console.error("checkUserExistingBooking error:", err);
    } finally {
      setLoadingExistingBooking(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
    fetchWaitlistSummary();
    if (user) {
      checkUserExistingBooking();
    }
  }, [id, user]);

  useEffect(() => {
    if (user && event) {
      checkUserExistingBooking();
    }
  }, [user, event?._id, event?.slug]);

  useEffect(() => {
    if (user) {
      if (!attendeeName) setAttendeeName(user.name);
      if (!attendeeEmail) setAttendeeEmail(user.email);
    }
  }, [user]);

  // Live countdown timer for active seat offers
  useEffect(() => {
    if (waitlistSummary?.userEntry?.status === "OFFERED" && waitlistSummary.userEntry.offerExpiresAt) {
      const expiresAt = new Date(waitlistSummary.userEntry.offerExpiresAt).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setCountdownSeconds(diff);
        if (diff <= 0) {
          fetchWaitlistSummary();
          fetchEventDetails();
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdownSeconds(0);
    }
  }, [waitlistSummary?.userEntry?.status, waitlistSummary?.userEntry?.offerExpiresAt]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        throw new Error("Event not found");
      }
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistSummary = async () => {
    try {
      const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const authHeaders = activeToken
        ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
        : {};

      const res = await fetch(`/api/waitlist/event/${id}`, {
        headers: authHeaders,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setWaitlistSummary(data);
      }
    } catch (err) {
      console.error("Failed to load waitlist summary:", err);
    }
  };

  const formatCountdown = (totalSeconds) => {
    if (totalSeconds <= 0) return "Offer Expired";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  // --- JOIN WAITLIST ---
  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    setWaitlistActionLoading(true);
    setWaitlistError("");
    setWaitlistMessage("");

    const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    const authHeaders = activeToken
      ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
      : {};

    try {
      const { ok, data } = await resilientFetch("/api/waitlist/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          eventId: event._id,
          attendeeName,
          attendeeEmail,
        }),
      });

      if (!ok) {
        if (data.error && data.error.toLowerCase().includes("already on the waitlist")) {
          fetchWaitlistSummary();
        }
        throw new Error(data.error || "Unable to join waitlist.");
      }

      setWaitlistMessage(data.message || "You have been added to the waitlist! Confirmation email sent.");
      if (data.waitlist) {
        setWaitlistSummary((prev) => ({
          ...prev,
          activeCount: data.activeCount || prev.activeCount + 1,
          userEntry: data.waitlist,
        }));
      }
      fetchWaitlistSummary();
    } catch (err) {
      setWaitlistError(err.message || "Failed to join waitlist.");
      fetchWaitlistSummary();
    } finally {
      setWaitlistActionLoading(false);
    }
  };

  // --- LEAVE WAITLIST ---
  const handleLeaveWaitlist = async () => {
    if (!waitlistSummary?.userEntry?._id) return;
    setWaitlistActionLoading(true);
    setWaitlistError("");

    const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    const authHeaders = activeToken
      ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
      : {};

    try {
      const { ok, data } = await resilientFetch(`/api/waitlist/${waitlistSummary.userEntry._id}/leave`, {
        method: "POST",
        headers: authHeaders,
        credentials: "include",
      });

      if (!ok) {
        throw new Error(data.error || "Failed to leave waitlist.");
      }

      setLeaveModalOpen(false);
      setWaitlistMessage("You have left the waitlist.");
      fetchWaitlistSummary();
      fetchEventDetails();
    } catch (err) {
      setWaitlistError(err.message || "Failed to leave waitlist.");
    } finally {
      setWaitlistActionLoading(false);
    }
  };

  // --- CLAIM OFFERED PASS ---
  const handleClaimOffer = async () => {
    const entry = waitlistSummary?.userEntry;
    if (!entry) return;

    setWaitlistActionLoading(true);
    setWaitlistError("");

    const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    const authHeaders = activeToken
      ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
      : {};

    try {
      // 1. FREE EVENT CLAIM
      if (event.price === 0) {
        const { ok, data } = await resilientFetch("/api/waitlist/claim/free", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          credentials: "include",
          body: JSON.stringify({
            waitlistId: entry._id,
            offerToken: entry.offerToken,
          }),
        });

        if (!ok) {
          throw new Error(data.error || "Failed to claim free pass.");
        }
        setBookingSuccess(data.booking);
        fetchWaitlistSummary();
        fetchEventDetails();
        return;
      }

      // 2. PAID EVENT CLAIM VIA RAZORPAY
      const { ok: initOk, data: initData } = await resilientFetch("/api/waitlist/claim/initiate-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify({
          waitlistId: entry._id,
          offerToken: entry.offerToken,
        }),
      });

      if (!initOk) {
        throw new Error(initData.error || "Failed to initiate payment checkout.");
      }

      const { razorpayOrder, bookingId } = initData;

      // Simulated mode fallback
      if (
        razorpayOrder.isSimulated ||
        !razorpayOrder.key ||
        razorpayOrder.key.includes("placeholder") ||
        typeof window.Razorpay === "undefined"
      ) {
        const { ok: simOk, data: simData } = await resilientFetch("/api/waitlist/claim/verify-paid", {
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

        if (simOk) {
          setBookingSuccess(simData.booking);
          fetchWaitlistSummary();
          fetchEventDetails();
        } else {
          setWaitlistError(simData.error || "Payment verification failed.");
        }
        return;
      }

      // Live Razorpay Modal
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Gather",
        description: `Waitlist Claim: ${event.title}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: entry.attendeeName,
          email: entry.attendeeEmail,
        },
        theme: { color: "#073F2E" },
        handler: async function (response) {
          try {
            const { ok: verifyOk, data: verifyData } = await resilientFetch("/api/waitlist/claim/verify-paid", {
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

            if (verifyOk) {
              setBookingSuccess(verifyData.booking);
              fetchWaitlistSummary();
              fetchEventDetails();
            } else {
              setWaitlistError(verifyData.error || "Payment verification failed.");
            }
          } catch (netErr) {
            console.error("Waitlist verify payment error:", netErr);
            setWaitlistError(netErr.message || "Failed to verify payment with server.");
          } finally {
            setWaitlistActionLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setWaitlistActionLoading(false);
            setWaitlistError("Payment was cancelled. Your seat offer remains active until expiry.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setWaitlistError(err.message || "Failed to claim seat offer.");
    } finally {
      setWaitlistActionLoading(false);
    }
  };

  // --- REGULAR BOOKING SUBMIT ---
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(null);

    const activeToken = userToken || token || (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
    const authHeaders = activeToken
      ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` }
      : {};

    try {
      const { ok, data } = await resilientFetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({
          eventId: event._id,
          seatsBooked,
          attendeeName,
          attendeeEmail,
        }),
      });

      if (!ok) {
        throw new Error(data.error || "Failed to complete booking");
      }

      if (data.isFree) {
        setBookingSuccess(data.booking);
        setToast({
          type: "success",
          title: "Registration Confirmed!",
          message: "Your free seat has been reserved. Digital pass is ready.",
          actionLabel: "View Digital Pass",
          onAction: () => setTicketModalOpen(true),
        });
        fetchEventDetails();
        return;
      }

      if (data.razorpayOrder) {
        if (
          data.razorpayOrder.isSimulated ||
          !data.razorpayOrder.key ||
          data.razorpayOrder.key.includes("placeholder") ||
          typeof window.Razorpay === "undefined"
        ) {
          try {
            const { ok: simOk, data: simData } = await resilientFetch("/api/bookings/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders,
              },
              credentials: "include",
              body: JSON.stringify({
                bookingId: data.bookingId,
                razorpayOrderId: data.razorpayOrder.id,
                razorpayPaymentId: `pay_sim_${Date.now()}`,
                razorpaySignature: "simulated_signature",
              }),
            });

            if (simOk) {
              setBookingSuccess(simData.booking);
              setToast({
                type: "success",
                title: "Payment Confirmed!",
                message: "Your booking is confirmed and your digital pass is ready.",
                actionLabel: "View Digital Pass",
                onAction: () => setTicketModalOpen(true),
              });
              fetchEventDetails();
            } else {
              const payErr = simData.error || "Payment verification failed.";
              setBookingError(payErr);
              setToast({
                type: "error",
                title: "Payment Verification Failed",
                message: payErr,
              });
            }
          } catch {
            const payErr = "Failed to record simulated payment.";
            setBookingError(payErr);
            setToast({
              type: "error",
              title: "Payment Error",
              message: payErr,
            });
          }
          return;
        }

        const options = {
          key: data.razorpayOrder.key,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency || "INR",
          name: "Gather",
          description: `Booking for ${event.title}`,
          order_id: data.razorpayOrder.id,
          prefill: {
            name: attendeeName,
            email: attendeeEmail,
          },
          theme: { color: "#073F2E" },
          handler: async function (response) {
            try {
              const { ok: verifyOk, data: verifyData } = await resilientFetch("/api/bookings/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...authHeaders,
                },
                credentials: "include",
                body: JSON.stringify({
                  bookingId: data.bookingId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              if (verifyOk) {
                setBookingSuccess(verifyData.booking);
                setToast({
                  type: "success",
                  title: "Payment Confirmed!",
                  message: "Your booking is confirmed and your digital pass is ready.",
                  actionLabel: "View Digital Pass",
                  onAction: () => setTicketModalOpen(true),
                });
                fetchEventDetails();
              } else {
                const payErr = verifyData.error || "Payment verification failed.";
                setBookingError(payErr);
                setToast({
                  type: "error",
                  title: "Payment Verification Failed",
                  message: payErr,
                });
              }
            } catch (networkErr) {
              console.error("Payment verification network error:", networkErr);
              const payErr = networkErr.message || "Failed to verify payment with server.";
              setBookingError(payErr);
              setToast({
                type: "error",
                title: "Network Error",
                message: payErr,
              });
            } finally {
              setBookingLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setBookingLoading(false);
              setBookingError("Payment checkout was cancelled. No seats were charged.");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      const errorMsg = err.message || "An unexpected error occurred during booking.";
      setBookingError(errorMsg);

      // Check if duplicate booking error
      if (
        errorMsg.toLowerCase().includes("already hold an active") ||
        errorMsg.toLowerCase().includes("active confirmed booking")
      ) {
        checkUserExistingBooking();
        setToast({
          type: "warning",
          title: "Active Booking Found",
          message: errorMsg,
          actionLabel: "View Digital Pass",
          onAction: () => setTicketModalOpen(true),
        });
      } else {
        setToast({
          type: "error",
          title: "Registration Failed",
          message: errorMsg,
        });
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
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

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F4ED]">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto py-24 px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#171915]">Event Not Found</h2>
          <p className="text-sm text-[#77776F] mt-2">
            The masterclass or workshop you requested does not exist or may have been unlisted.
          </p>
          <Link href="/events" className="btn-forest px-6 py-2.5 rounded-full text-xs font-semibold inline-block mt-6">
            Back to catalogue
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFree = event.price === 0;
  const isSoldOut = event.availableSeats === 0;
  const maxSelectableSeats = Math.min(event.availableSeats, 6);
  const totalCost = event.price * seatsBooked;

  const userWaitlistEntry = waitlistSummary?.userEntry;
  const isUserOffered = userWaitlistEntry?.status === "OFFERED";
  const isUserWaiting = Boolean(
    userWaitlistEntry?.status === "WAITING" ||
    (waitlistError && waitlistError.toLowerCase().includes("already on the waitlist"))
  );
  const waitlistCount = Math.max(waitlistSummary?.activeCount || 0, isUserWaiting ? 1 : 0);
  const isWaitlistFull = waitlistSummary?.isWaitlistFull;

  const isAlreadyBooked = Boolean(
    existingBooking ||
      (bookingError &&
        (bookingError.toLowerCase().includes("already hold an active") ||
          bookingError.toLowerCase().includes("active confirmed booking")))
  );

  const extractedBookingRef = (bookingError?.match(/Ref:\s*([A-Za-z0-9\-]+)/) || [])[1];

  const effectiveActiveBooking =
    existingBooking ||
    (isAlreadyBooked
      ? {
          _id: "active-booking",
          bookingRef: extractedBookingRef || "ACTIVE-PASS",
          seatsBooked: seatsBooked || 1,
          attendeeName: attendeeName || user?.name || "Attendee",
          attendeeEmail: attendeeEmail || user?.email || "",
          event: event,
          bookingStatus: "confirmed",
        }
      : null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED]">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#77776F]">
            <Link href="/" className="hover:text-[#171915]">Home</Link>
            <span>/</span>
            <Link href="/events" className="hover:text-[#171915]">Sessions</Link>
            <span>/</span>
            <span className="text-[#171915] truncate max-w-xs">{event.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left 7 Columns: Event Visuals, Description & Metadata */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Cover Image */}
              <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-[#E7E2D8] bg-[#EBE7DF] shadow-md">
                <Image
                  src={event.image || "/images/event-design-studio.jpg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#FFFEFA]/95 text-[#073F2E] shadow-sm backdrop-blur-xs">
                    {event.category}
                  </span>
                  {event.isOnline && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#073F2E] text-white shadow-sm">
                      Online Masterclass
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Core Details */}
              <div className="space-y-4">
                <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#171915] tracking-tight leading-tight">
                  {event.title}
                </h1>

                {/* Key Attributes Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E7E2D8]">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF3E8] flex items-center justify-center text-[#073F2E]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#77776F] block tracking-wider">Date</span>
                      <span className="text-xs font-bold text-[#171915]">{event.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E7E2D8]">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF3E8] flex items-center justify-center text-[#073F2E]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#77776F] block tracking-wider">Schedule</span>
                      <span className="text-xs font-bold text-[#171915]">{event.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E7E2D8]">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF3E8] flex items-center justify-center text-[#073F2E]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-[#77776F] block tracking-wider">Location</span>
                      <span className="text-xs font-bold text-[#171915] truncate block">{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 pt-2">
                <h2 className="font-serif text-2xl font-bold text-[#171915]">
                  About This Gathering
                </h2>
                <div className="prose prose-sm text-[#77776F] leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {event.description}
                </div>
              </div>

              {/* Organizer Badge */}
              <div className="p-5 rounded-2xl bg-[#EBE7DF]/60 border border-[#E7E2D8] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#77776F] block">Curated and hosted by</span>
                  <span className="text-sm font-bold text-[#171915]">{event.organizerName}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#073F2E] text-[#A9C3A0] flex items-center justify-center font-bold text-sm">
                  {event.organizerName.substring(0, 2).toUpperCase()}
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Booking Card & Waitlist Checkout Form */}
            <div className="lg:col-span-5 sticky top-28">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] p-4 sm:p-8 shadow-xl space-y-6">
                
                {/* Pricing & Seat Capacity Banner */}
                <div className="flex items-baseline justify-between pb-6 border-b border-[#E7E2D8]">
                  <div>
                    <span className="text-xs uppercase font-bold text-[#77776F] tracking-wider block">
                      Registration Fee
                    </span>
                    <div className="mt-1">
                      <PriceTag
                        amount={event.price}
                        isFree={isFree}
                        iconClassName="w-5 h-5"
                        textClassName="text-3xl font-bold tracking-tight text-[#171915]"
                        freeLabel="Free Admission"
                        suffix="/ seat"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-[#77776F] tracking-wider block">
                      {effectiveActiveBooking ? "Booking Status" : "Capacity"}
                    </span>
                    <span className={`text-sm font-semibold ${effectiveActiveBooking ? "text-[#073F2E]" : isSoldOut ? "text-red-600" : "text-[#073F2E]"}`}>
                      {effectiveActiveBooking
                        ? "Pass Confirmed ✓"
                        : isSoldOut
                        ? "0 seats available"
                        : `${event.availableSeats} of ${event.totalSeats} seats left`}
                    </span>
                  </div>
                </div>

                {/* 1. EXISTING CONFIRMED BOOKING (ALREADY BOOKED BY CURRENT USER) */}
                {effectiveActiveBooking ? (() => {
                  const activeTicket = existingTickets[0] || effectiveActiveBooking.ticketSummary || null;
                  const qrCodeValue =
                    activeTicket?.ticketCode ||
                    effectiveActiveBooking.ticketCode ||
                    effectiveActiveBooking.bookingRef;
                  const qrImageSrc =
                    activeTicket?.qrDataUrl ||
                    effectiveActiveBooking.qrDataUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      qrCodeValue || "PASS"
                    )}&color=073F2E&bgcolor=FFFFFF`;

                  return (
                    <div className="bg-[#FAF8F5] border-2 border-[#A9C3A0] rounded-3xl p-6 text-center space-y-4 shadow-md animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-[#EBF3E8] border border-[#A9C3A0] text-[#073F2E] flex items-center justify-center mx-auto shadow-2xs">
                        <CheckCircle2 className="w-6 h-6 text-[#073F2E]" />
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#073F2E] bg-[#EBF3E8] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                          Confirmed Attendee
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-[#171915]">
                          You Already Booked This Event
                        </h3>
                        <p className="text-xs text-[#77776F] mt-1 max-w-xs mx-auto leading-relaxed">
                          You hold an active verified admission reservation for <strong>{event.title}</strong>. Your check-in pass and QR code are ready below.
                        </p>
                      </div>

                      {/* Prominent High-Resolution QR Card */}
                      <div className="bg-white border-2 border-[#E7E2D8] rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="relative mx-auto w-48 h-48 bg-white rounded-xl border border-[#E7E2D8] flex items-center justify-center p-2 shadow-2xs group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrImageSrc}
                            alt={`Check-in QR Pass for ${effectiveActiveBooking.bookingRef}`}
                            className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#77776F] tracking-wider block">
                            Check-in Pass Code
                          </span>
                          <span className="font-mono text-sm font-extrabold tracking-widest text-[#073F2E] bg-[#EBF3E8] px-3 py-1 rounded-md inline-block">
                            {qrCodeValue}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketModalOpen(true)}
                            className="text-xs font-semibold text-[#073F2E] hover:underline inline-flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#073F2E]" />
                            <span>Enlarge &amp; View Pass Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Booking Reference Pill */}
                      <div className="bg-[#F4F1EA] border border-[#E7E2D8] rounded-xl p-3 text-xs space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[#77776F] text-[11px]">Booking Reference:</span>
                          <span className="font-mono font-bold text-[#171915] text-xs">
                            {effectiveActiveBooking.bookingRef}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#77776F] text-[11px]">Seats Reserved:</span>
                          <span className="font-bold text-[#073F2E] text-xs">
                            {effectiveActiveBooking.seatsBooked || 1} {effectiveActiveBooking.seatsBooked === 1 ? "Seat" : "Seats"}
                          </span>
                        </div>
                        {effectiveActiveBooking.attendeeName && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#77776F] text-[11px]">Attendee:</span>
                            <span className="font-medium text-[#171915] text-xs truncate max-w-[150px]">
                              {effectiveActiveBooking.attendeeName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Primary Action Button: Open Pop Up Pass */}
                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setTicketModalOpen(true)}
                          className="btn-forest w-full py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Show Ticket Pass (Open Pop Up)</span>
                        </button>
                        {/* Secondary Action: Go to Ticket Page */}
                        <Link
                          href="/account/bookings"
                          className="btn-secondary w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>Go to My Tickets Page</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })() : bookingSuccess ? (() => {
                  const activeTicket = confirmedTickets[0] || null;
                  const qrCodeValue = activeTicket?.ticketCode || bookingSuccess.ticketCode || bookingSuccess.bookingRef;
                  const qrImageSrc =
                    activeTicket?.qrDataUrl ||
                    bookingSuccess.qrDataUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrCodeValue)}&color=073F2E&bgcolor=FFFFFF`;

                  return (
                    <div className="bg-[#FAF8F5] border-2 border-[#A9C3A0] rounded-3xl p-6 text-center space-y-4 shadow-md animate-fadeIn">
                      <div className="w-12 h-12 rounded-full bg-[#EBF3E8] border border-[#A9C3A0] text-[#073F2E] flex items-center justify-center mx-auto shadow-2xs">
                        <CheckCircle2 className="w-6 h-6 text-[#073F2E]" />
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#073F2E] bg-[#EBF3E8] px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                          Official Admission Pass
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-[#171915]">
                          Pass Confirmed!
                        </h3>
                        <p className="text-xs text-[#77776F] mt-1 max-w-xs mx-auto leading-relaxed">
                          Your seats for <strong>{event.title}</strong> have been secured. Present this verified QR code at the check-in desk upon arrival.
                        </p>
                      </div>

                      {/* Prominent High-Resolution QR Card */}
                      <div className="bg-white border-2 border-[#E7E2D8] rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="relative mx-auto w-48 h-48 bg-white rounded-xl border border-[#E7E2D8] flex items-center justify-center p-2 shadow-2xs group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrImageSrc}
                            alt={`Check-in QR Pass for ${bookingSuccess.bookingRef}`}
                            className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#77776F] tracking-wider block">
                            Check-in Code
                          </span>
                          <span className="font-mono text-sm font-extrabold tracking-widest text-[#073F2E] bg-[#EBF3E8] px-3 py-1 rounded-md inline-block">
                            {activeTicket?.ticketCode || bookingSuccess.ticketCode || bookingSuccess.bookingRef}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketModalOpen(true)}
                            className="text-xs font-semibold text-[#073F2E] hover:underline inline-flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#073F2E]" />
                            <span>Enlarge &amp; View Pass Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Booking Reference Pill */}
                      <div className="bg-[#F4F1EA] border border-[#E7E2D8] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="text-[#77776F] text-[11px]">Booking Reference:</span>
                        <span className="font-mono font-bold text-[#171915] text-xs">
                          {bookingSuccess.bookingRef}
                        </span>
                      </div>

                      {/* Action Links */}
                      <div className="flex flex-col gap-2 pt-1">
                        <Link
                          href="/account/bookings"
                          className="btn-forest w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>View in My Passes</span>
                        </Link>
                        <button
                          onClick={() => {
                            setBookingSuccess(null);
                            setConfirmedTickets([]);
                            fetchEventDetails();
                            fetchWaitlistSummary();
                          }}
                          className="text-xs text-[#77776F] hover:text-[#171915] font-medium py-1"
                        >
                          Back to session details
                        </button>
                      </div>
                    </div>
                  );
                })() : isSoldOut ? (
                  /* 2. SOLD OUT & WAITLIST SECTION */
                  <div className="space-y-4">
                    
                    {waitlistError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{waitlistError}</span>
                      </div>
                    )}

                    {waitlistMessage && (
                      <div className="p-3 bg-[#EBF3E8] border border-[#A9C3A0] text-[#073F2E] text-xs rounded-xl flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{waitlistMessage}</span>
                      </div>
                    )}

                    {/* CASE 2A: USER HAS AN ACTIVE SEAT OFFER (2-HOUR WINDOW) */}
                    {isUserOffered ? (
                      <div className="bg-[#FFFDF0] border-2 border-[#ECC968] rounded-2xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECC968]/30 text-[#7A5700] text-[11px] font-bold uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-[#C2A265]" />
                          Seat Reserved For You
                        </div>

                        <div>
                          <h3 className="font-serif text-xl font-bold text-[#171915]">
                            A Spot Just Opened Up!
                          </h3>
                          <p className="text-xs text-[#77776F] mt-1">
                            Because you reached the top of the queue, 1 seat has been temporarily reserved exclusively for your account.
                          </p>
                        </div>

                        {/* Urgent Countdown */}
                        <div className="bg-white border border-[#ECC968] rounded-xl p-3">
                          <span className="text-[10px] uppercase font-bold text-[#8C4A00] tracking-wider block">
                            Acceptance Window
                          </span>
                          <span className="text-xl font-mono font-extrabold text-[#8C4A00]">
                            {formatCountdown(countdownSeconds)}
                          </span>
                          <span className="text-[10px] text-[#77776F] block mt-0.5">
                            If unclaimed, this seat will pass to the next attendee in line.
                          </span>
                        </div>

                        <div className="space-y-2 pt-2">
                          <button
                            onClick={handleClaimOffer}
                            disabled={waitlistActionLoading || countdownSeconds <= 0}
                            className="btn-forest w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                          >
                            {waitlistActionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Ticket className="w-4 h-4" />
                                <span>{isFree ? "Confirm Free Admission Pass" : `Pay ₹${event.price} & Confirm Ticket`}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setLeaveModalOpen(true)}
                            disabled={waitlistActionLoading}
                            className="text-xs font-semibold text-red-700 hover:text-red-900 block w-full py-1.5"
                          >
                            Decline &amp; Release to Next Person
                          </button>
                        </div>
                      </div>
                    ) : isUserWaiting ? (() => {
                      const posNumber = userWaitlistEntry?.queuePosition || 1;
                      const { ordinal, word, label } = formatOrdinal(posNumber);

                      return (
                        <div className="bg-[#FAF8F5] border-2 border-[#A9C3A0] rounded-3xl p-6 text-center space-y-4 shadow-sm animate-fadeIn">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3E8] border border-[#A9C3A0] text-[#073F2E] text-[11px] font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-[#073F2E] animate-pulse"></span>
                            You Are On The Waitlist
                          </div>

                          <div>
                            <div className="text-4xl sm:text-5xl font-serif font-bold text-[#073F2E] tracking-tight">
                              #{posNumber}
                            </div>
                            <div className="mt-1.5">
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-[#073F2E] bg-[#EBF3E8] border border-[#A9C3A0]/60">
                                {label}
                              </span>
                            </div>
                            <h3 className="font-serif text-lg font-bold text-[#171915] mt-2">
                              Your Waitlist Position: {ordinal} in Line
                            </h3>
                            <p className="text-xs text-[#77776F] mt-1.5 max-w-xs mx-auto leading-relaxed">
                              There are currently <strong>{waitlistCount}</strong> attendee(s) waiting. A confirmation has been sent to your email.
                            </p>
                          </div>

                          {/* Automated Promotion & Payment Option Card */}
                          <div className="bg-white border border-[#E7E2D8] rounded-2xl p-4 text-left space-y-2.5 text-xs shadow-2xs">
                            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
                              <span className="text-[#77776F] font-medium text-[11px]">Queue Standing:</span>
                              <span className="font-bold text-[#073F2E] text-xs">
                                {posNumber === 1 ? "1st (Next to be offered a seat)" : `${ordinal} in Line`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
                              <span className="text-[#77776F] font-medium text-[11px]">Total Waiting:</span>
                              <span className="font-semibold text-[#171915] text-xs">
                                {waitlistCount} of 10 attendees
                              </span>
                            </div>
                            <div className="pt-1 flex items-start gap-2 text-[11px] text-[#77776F] leading-relaxed">
                              <Sparkles className="w-3.5 h-3.5 text-[#073F2E] shrink-0 mt-0.5" />
                              <span>
                                <strong>Automatic Confirmation &amp; Payment:</strong> When the admin upgrades session slots or an attendee cancels, this seat will automatically be reserved for you with an email containing the direct payment option.
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-1 space-y-2">
                            <Link
                              href="/account/bookings"
                              className="btn-forest w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>View My Passes &amp; Waitlist</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => setLeaveModalOpen(true)}
                              disabled={waitlistActionLoading}
                              className="text-xs font-semibold text-[#77776F] hover:text-red-700 transition-colors py-1 cursor-pointer"
                            >
                              Leave Waitlist Queue
                            </button>
                          </div>
                        </div>
                      );
                    })() : isWaitlistFull ? (
                      /* CASE 2C: EVENT SOLD OUT AND WAITLIST IS FULL (10/10) */
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                        <h3 className="font-serif text-lg font-bold text-red-900">
                          Sold Out &amp; Waitlist Full
                        </h3>
                        <p className="text-xs text-red-700 leading-relaxed">
                          All {event.totalSeats} seats and the 10-person waitlist queue are completely full.
                        </p>
                        <Link
                          href="/events"
                          className="btn-secondary w-full py-2.5 rounded-full text-xs font-semibold inline-block mt-2"
                        >
                          Explore Other Gather Sessions
                        </Link>
                      </div>
                    ) : (
                      /* CASE 2D: EVENT SOLD OUT BUT WAITLIST HAS OPEN SPOTS */
                      <div className="space-y-4">
                        <div className="bg-[#FAF8F5] border border-[#E7E2D8] rounded-2xl p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                              Sold Out
                            </span>
                            <span className="text-xs font-semibold text-[#073F2E] bg-[#EBF3E8] px-2.5 py-0.5 rounded-full">
                              {waitlistCount}/10 Waiting
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-[#171915]">
                            Join the Waitlist
                          </h3>
                          <p className="text-xs text-[#77776F] leading-relaxed">
                            Spots occasionally open up when attendees reschedule. Join the waitlist to receive an automated notification and a 2-hour priority window to book.
                          </p>
                        </div>

                        {!user ? (
                          <div className="space-y-2">
                            <Link
                              href={`/login?redirect=/events/${id}`}
                              className="btn-forest w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <span>Sign in to Join Waitlist</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="text-[11px] text-[#77776F] text-center">
                              Only authenticated attendees can hold waitlist priority.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleJoinWaitlist} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171915] mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                required
                                value={attendeeName}
                                onChange={(e) => setAttendeeName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#F7F4ED] text-sm text-[#171915] focus:outline-none focus:border-[#073F2E]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#171915] mb-1">
                                Notification Email Address
                              </label>
                              <input
                                type="email"
                                required
                                value={attendeeEmail}
                                onChange={(e) => setAttendeeEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#F7F4ED] text-sm text-[#171915] focus:outline-none focus:border-[#073F2E]"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={waitlistActionLoading}
                              className="btn-forest w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                            >
                              {waitlistActionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Bell className="w-4 h-4" />
                                  <span>Join Waitlist ({10 - waitlistCount} spots left)</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 3. NORMAL REGISTRATION FLOW (SEATS AVAILABLE) */
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    
                    {bookingError && (
                      <div
                        className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                          bookingError.toLowerCase().includes("already hold an active")
                            ? "bg-amber-50 border-amber-300 text-amber-950"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {bookingError.toLowerCase().includes("already hold an active") ? (
                            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <span className="font-semibold block mb-0.5">
                              {bookingError.toLowerCase().includes("already hold an active")
                                ? "Active Booking Exists"
                                : "Booking Notice"}
                            </span>
                            <span className="leading-relaxed opacity-95">{bookingError}</span>
                          </div>
                        </div>

                        {bookingError.toLowerCase().includes("already hold an active") && (
                          <div className="pt-1 flex items-center">
                            <Link
                              href="/account/bookings"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#073F2E] hover:bg-[#052F22] text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>View My Digital Passes</span>
                              <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Professional Custom Seat Selector */}
                    <div className="relative" ref={seatDropdownRef}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#171915]">
                          Number of Seats
                        </label>
                        <span className="text-[11px] font-medium text-[#77776F]">
                          Max {maxSelectableSeats} per booking
                        </span>
                      </div>

                      {/* Selector Trigger Button */}
                      <button
                        type="button"
                        id="seat-dropdown-trigger"
                        onClick={() => setSeatDropdownOpen((prev) => !prev)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                          seatDropdownOpen
                            ? "border-[#073F2E] bg-white ring-2 ring-[#073F2E]/10"
                            : "border-[#E7E2D8] bg-[#FAF8F5] hover:bg-white hover:border-[#073F2E]/40"
                        }`}
                        aria-haspopup="listbox"
                        aria-expanded={seatDropdownOpen}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center flex-shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[#171915]">
                              {seatsBooked} {seatsBooked === 1 ? "Seat" : "Seats"}
                            </span>
                            {!isFree && (
                              <span className="text-xs font-semibold text-[#073F2E]">
                                (₹{event.price * seatsBooked})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-[#77776F] hidden sm:inline">
                            {seatsBooked === 1 ? "Solo Pass" : "Group Pass"}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#77776F] transition-transform duration-200 ${
                              seatDropdownOpen ? "rotate-180 text-[#073F2E]" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Dropdown Menu Popover */}
                      {seatDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#FFFEFA] border border-[#E7E2D8] rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77776F] border-b border-[#E7E2D8]/60 mb-1">
                            Select Admission Quantity
                          </div>
                          {Array.from({ length: maxSelectableSeats }, (_, i) => i + 1).map((n) => {
                            const isSelected = n === seatsBooked;
                            const seatPrice = isFree ? 0 : event.price * n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setSeatsBooked(n);
                                  setSeatDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#EBF3E8] text-[#073F2E] font-bold border border-[#073F2E]/15"
                                    : "hover:bg-[#FAF8F5] text-[#171915]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                      isSelected
                                        ? "bg-[#073F2E] text-white"
                                        : "bg-[#F4F1EA] text-[#77776F]"
                                    }`}
                                  >
                                    {n}
                                  </div>
                                  <div>
                                    <span className="text-xs sm:text-sm font-semibold block leading-snug">
                                      {n} {n === 1 ? "Admission Seat" : "Admission Seats"}
                                    </span>
                                    <span className="text-[10px] text-[#77776F]">
                                      {n === 1 ? "Single Attendee Pass" : `Standard Group (${n} Guests)`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                      isSelected
                                        ? "bg-[#073F2E] text-white"
                                        : "bg-[#F4F1EA] text-[#171915]"
                                    }`}
                                  >
                                    {isFree ? "Free" : `₹${seatPrice}`}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#073F2E] flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Attendee Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#171915] mb-1.5">
                        Attendee Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jane Doe"
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#F7F4ED] text-sm text-[#171915] focus:outline-none focus:border-[#073F2E]"
                      />
                    </div>

                    {/* Attendee Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#171915] mb-1.5">
                        Confirmation Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. jane@example.com"
                        value={attendeeEmail}
                        onChange={(e) => setAttendeeEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#F7F4ED] text-sm text-[#171915] focus:outline-none focus:border-[#073F2E]"
                      />
                    </div>

                    {/* Total Summary */}
                    {!isFree && (
                      <div className="pt-3 pb-1 border-t border-[#E7E2D8] flex items-center justify-between text-sm">
                        <span className="text-[#77776F] font-medium">Total Payable:</span>
                        <PriceTag
                          amount={totalCost}
                          iconClassName="w-4 h-4"
                          textClassName="font-bold text-xl text-[#171915]"
                        />
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      {!user ? (
                        <Link
                          href={`/login?redirect=/events/${id}`}
                          className="btn-forest w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <span>Sign in to Reserve Seat</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          type="submit"
                          disabled={bookingLoading}
                          className="btn-forest w-full py-3.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          {bookingLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span>{isFree ? "Confirm Free Registration" : `Pay ₹${totalCost} & Complete Booking`}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-3 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#77776F]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#073F2E]" />
                        <span>Instant QR Pass &amp; Email Delivery</span>
                      </div>
                      {!isFree && (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#77776F]">
                          <CreditCard className="w-3.5 h-3.5 text-[#073F2E]" />
                          <span>Secured by Razorpay Encryption</span>
                        </div>
                      )}
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Confirm Leave Waitlist Modal */}
      <ConfirmDialog
        isOpen={leaveModalOpen}
        title="Leave Waitlist Queue?"
        description={
          isUserOffered
            ? "You currently have an active reserved seat offer! If you leave, this seat will immediately be offered to the next attendee in line."
            : "Are you sure you want to leave the waitlist? You will lose your current priority position in line."
        }
        confirmText="Leave Waitlist"
        cancelText="Keep My Spot"
        variant="warning"
        loading={waitlistActionLoading}
        onConfirm={handleLeaveWaitlist}
        onClose={() => setLeaveModalOpen(false)}
      />

      {/* Interactive Digital Pass Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        booking={
          effectiveActiveBooking
            ? {
                _id: effectiveActiveBooking?._id || effectiveActiveBooking?.id,
                bookingRef: effectiveActiveBooking?.bookingRef,
                attendeeName: effectiveActiveBooking?.attendeeName || attendeeName || user?.name || "Attendee",
                seatsBooked: effectiveActiveBooking?.seatsBooked || seatsBooked || 1,
                amount: effectiveActiveBooking?.amount || (event?.price ? event.price * (effectiveActiveBooking?.seatsBooked || 1) : 0),
                event,
              }
            : {
                _id: bookingSuccess?.id || bookingSuccess?._id,
                bookingRef: bookingSuccess?.bookingRef,
                attendeeName: attendeeName || user?.name || "Attendee",
                seatsBooked: bookingSuccess?.seatsBooked || seatsBooked || 1,
                amount: event?.price ? event.price * (bookingSuccess?.seatsBooked || seatsBooked || 1) : 0,
                event,
              }
        }
        tickets={
          existingTickets.length > 0
            ? existingTickets
            : confirmedTickets.length > 0
            ? confirmedTickets
            : [
                {
                  ticketCode:
                    effectiveActiveBooking?.ticketSummary?.ticketCode ||
                    effectiveActiveBooking?.ticketCode ||
                    effectiveActiveBooking?.bookingRef ||
                    bookingSuccess?.ticketCode ||
                    bookingSuccess?.bookingRef ||
                    "GATHER",
                  seatNumber: 1,
                  totalSeats: effectiveActiveBooking?.seatsBooked || bookingSuccess?.seatsBooked || seatsBooked || 1,
                  status: "valid",
                  qrDataUrl:
                    effectiveActiveBooking?.ticketSummary?.qrDataUrl ||
                    effectiveActiveBooking?.qrDataUrl ||
                    bookingSuccess?.qrDataUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      effectiveActiveBooking?.ticketSummary?.ticketCode ||
                        effectiveActiveBooking?.ticketCode ||
                        effectiveActiveBooking?.bookingRef ||
                        bookingSuccess?.ticketCode ||
                        bookingSuccess?.bookingRef ||
                        "GATHER"
                    )}&color=073F2E&bgcolor=FFFFFF`,
                  event,
                },
              ]
        }
        loading={loadingTickets || loadingExistingBooking}
      />

      {/* Top-Right Screen Toast Notification */}
      {toast && (
        <div className="fixed top-20 sm:top-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-full max-w-md sm:max-w-sm mx-auto sm:mx-0 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div
            className={`p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${
              toast.type === "success"
                ? "bg-[#FAF8F5]/95 border-[#073F2E]/30 text-[#073F2E]"
                : toast.type === "warning"
                ? "bg-amber-50/95 border-amber-300 text-amber-950"
                : "bg-red-50/95 border-red-300 text-red-950"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#073F2E] flex-shrink-0 mt-0.5" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="font-serif font-bold text-sm leading-tight text-[#171915]">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-[#555] mt-1 leading-relaxed">
                {toast.message}
              </p>

              {toast.actionLabel && (
                <div className="mt-2.5">
                  <button
                    onClick={() => {
                      if (toast.onAction) toast.onAction();
                      setToast(null);
                    }}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#073F2E] text-white text-xs font-semibold hover:bg-[#052F22] transition-colors shadow-xs cursor-pointer"
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setToast(null)}
              type="button"
              className="text-[#77776F] hover:text-[#171915] p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
