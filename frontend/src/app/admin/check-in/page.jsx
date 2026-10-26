"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  User,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  History,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";

export default function AdminCheckInPage() {
  const [events, setEvents] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Camera scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef(null);

  // Verification result state
  const [scanResult, setScanResult] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(null);

  // Session check-in history
  const [checkInHistory, setCheckInHistory] = useState([]);

  // Fetch events & stats on mount
  useEffect(() => {
    fetchEvents();
    fetchBookingsForStats();
    return () => {
      stopCameraScanner();
    };
  }, []);

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

  const fetchBookingsForStats = async () => {
    try {
      const res = await fetch("/api/admin/bookings", { headers: getAdminHeaders(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllBookings(data.bookings || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const startCameraScanner = async () => {
    setCameraError("");
    setScanResult(null);
    setCheckInSuccess(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode("admin-qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Pause scanning while verifying
          try {
            await html5QrCode.pause();
          } catch {
            // ignore
          }

          setIsScanning(false);
          await handleVerifyCode(decodedText);
        },
        () => {
          // Frame scan error (no QR in frame) - ignore
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera startup error:", err);
      setCameraError(
        err?.message ||
          "Could not access camera. Please verify camera permissions in your browser, or use the manual code lookup below."
      );
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Camera stop notice:", err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleVerifyCode = async (codeToVerify) => {
    const query = (codeToVerify || manualQuery).trim();
    if (!query) return;

    setIsVerifying(true);
    setScanResult(null);
    setCheckInSuccess(null);

    try {
      const res = await fetch("/api/tickets/admin/verify", {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({
          query,
          eventId: selectedEventId || null,
        }),
      });

      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      setScanResult({
        valid: false,
        code: "NETWORK_ERROR",
        message: "Failed to communicate with authentication server. Check connection.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmAdmission = async (ticketId) => {
    if (!ticketId) return;

    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/tickets/admin/check-in", {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: "include",
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCheckInSuccess(data);
        setScanResult(null);
        setManualQuery("");

        // Add to session check-in history
        const admittedItem = {
          id: data.ticket._id,
          ticketCode: data.ticket.ticketCode,
          attendeeName: data.ticket.attendeeName,
          eventTitle: data.ticket.event?.title || scanResult?.event?.title || "Gather Session",
          time: new Date().toLocaleTimeString(),
          seatNumber: data.ticket.seatNumber,
        };

        setCheckInHistory((prev) => [admittedItem, ...prev.slice(0, 9)]);
      } else {
        setScanResult({
          valid: false,
          code: data.code || "CHECKIN_FAILED",
          message: data.message || "Failed to confirm check-in.",
          ticket: data.ticket || scanResult?.ticket,
          event: scanResult?.event,
        });
      }
    } catch (err) {
      setScanResult({
        valid: false,
        code: "CHECKIN_ERROR",
        message: "Network error occurred while confirming admission.",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const activeBookings = selectedEventId
    ? allBookings.filter((b) => (b.event?._id || b.event) === selectedEventId)
    : allBookings;

  const totalExpectedSeats = activeBookings.reduce(
    (sum, b) => (b.bookingStatus === "confirmed" ? sum + (b.seatsBooked || 1) : sum),
    0
  );

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E2D8] pb-6">
        <div>
          <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1">
            VENUE OPERATIONS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#171915]">
            Ticket Scanner &amp; Check-In
          </h1>
          <p className="text-xs sm:text-sm text-[#77776F] mt-1 max-w-2xl">
            Scan attendee QR passes or look up booking references for verified door admission. Concurrency protection prevents duplicate check-ins.
          </p>
        </div>

        {/* Event Filter Selector */}
        <div className="sm:w-72">
          <label className="text-[11px] font-bold text-[#77776F] uppercase tracking-wider block mb-1.5">
            Active Event / Session
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setScanResult(null);
              setCheckInSuccess(null);
            }}
            className="w-full text-xs font-medium bg-white border border-[#E7E2D8] rounded-xl px-3 py-2.5 text-[#171915] focus:outline-none focus:border-[#073F2E] shadow-2xs"
          >
            <option value="">All Events (Any Session)</option>
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({evt.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Metric KPI Cards matching Events page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Verified Check-Ins */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Admitted guests</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {checkInHistory.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
              <span>↗</span>
              <span>Live door check-ins</span>
            </div>
          </div>
        </div>

        {/* Card 2: Expected Attendees */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Expected passes</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {totalExpectedSeats || 9}
            </div>
            <div className="text-[11px] text-[#77776F]">Confirmed ticket holders</div>
          </div>
        </div>

        {/* Card 3: Active Sessions */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Monitored events</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              {selectedEventId ? 1 : events.length}
            </div>
            <div className="text-[11px] text-[#77776F]">Active admission points</div>
          </div>
        </div>

        {/* Card 4: Concurrency Shield */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-xs font-medium text-[#77776F]">Security status</div>
            <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
              Secured
            </div>
            <div className="text-[11px] text-[#77776F]">Anti-duplicate protection</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scanner & Lookup on left, Verification Result on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Scanner + Manual Lookup) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Camera Scanner Card */}
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#171915]">
                    Camera QR Scanner
                  </h2>
                  <p className="text-xs text-[#77776F]">
                    Scan QR code from attendee phone screen or printed pass
                  </p>
                </div>
              </div>

              {isScanning ? (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="btn-secondary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="btn-forest px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Scanner</span>
                </button>
              )}
            </div>

            {/* Video Preview Area */}
            <div className="relative min-h-[260px] bg-[#FAF8F5] border-2 border-dashed border-[#073F2E]/20 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
              <div
                id="admin-qr-reader"
                className={`w-full max-w-sm rounded-xl overflow-hidden ${!isScanning && "hidden"}`}
              />

              {!isScanning && !cameraError && (
                <div className="text-center space-y-3 py-10">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#E7E2D8] text-[#073F2E] flex items-center justify-center mx-auto shadow-xs">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#171915]">
                      Camera is Currently Idle
                    </p>
                    <p className="text-[11px] text-[#77776F] max-w-xs mx-auto">
                      Click &ldquo;Start Scanner&rdquo; above to request browser camera permission, or use manual lookup below.
                    </p>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="text-center space-y-2 py-6 max-w-md">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-amber-900">Camera Notice</p>
                  <p className="text-[11px] text-[#77776F]">{cameraError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Reference Lookup Card */}
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D8] text-[#073F2E] flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#171915]">
                  Manual Code Lookup
                </h2>
                <p className="text-xs text-[#77776F]">
                  Enter Ticket Code (GF-XXXX-XXXX-XXXX) or Booking Ref (EF-XXXX-XXXX)
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="e.g. GF-7922-87D4-0851 or EF-MVJ5FDN9-NENE"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                className="flex-1 text-xs font-mono font-medium uppercase bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl px-4 py-3 text-[#171915] placeholder:normal-case placeholder:font-sans placeholder:text-[#77776F] focus:outline-none focus:border-[#073F2E] focus:bg-white"
              />
              <button
                type="submit"
                disabled={isVerifying || !manualQuery.trim()}
                className="btn-forest px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Verify</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (Verification Result & Session History) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-time Verification Result Panel */}
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-4">
              <h2 className="font-serif text-lg font-bold text-[#171915]">
                Admission Verification
              </h2>
              {isVerifying && (
                <div className="flex items-center gap-1.5 text-xs text-[#073F2E]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying pass...</span>
                </div>
              )}
            </div>

            {/* State A: Check-In Succeeded Confirmation */}
            {checkInSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                    ADMISSION CONFIRMED
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-emerald-950">
                    {checkInSuccess.ticket.attendeeName}
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Seat #{checkInSuccess.ticket.seatNumber} admitted at{" "}
                    {new Date(checkInSuccess.ticket.checkedInAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="bg-white/80 rounded-xl p-3 text-xs text-left space-y-1 font-mono text-emerald-900 border border-emerald-200">
                  <p>Pass: {checkInSuccess.ticket.ticketCode}</p>
                  <p>Ref: {checkInSuccess.ticket.booking?.bookingRef}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckInSuccess(null);
                    setManualQuery("");
                  }}
                  className="btn-forest w-full py-2.5 rounded-full text-xs font-semibold cursor-pointer"
                >
                  Ready for Next Attendee
                </button>
              </div>
            )}

            {/* State B: Valid Pass Found - Ready to Check In */}
            {scanResult && scanResult.valid && (
              <div className="bg-[#FAF8F5] border-2 border-[#073F2E] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="bg-[#073F2E] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                    Ready for Check-In
                  </span>
                  <span className="font-mono text-xs font-bold text-[#073F2E]">
                    {scanResult.ticket?.ticketCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#77776F]">
                    Attendee
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#171915]">
                    {scanResult.ticket?.attendeeName}
                  </h3>
                  <p className="text-xs text-[#77776F]">{scanResult.ticket?.attendeeEmail}</p>
                </div>

                <div className="bg-white rounded-xl border border-[#E7E2D8] p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#77776F]">Event:</span>
                    <span className="font-semibold text-[#171915] text-right">
                      {scanResult.event?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77776F]">Schedule:</span>
                    <span className="font-medium text-[#171915]">
                      {scanResult.event?.date} • {scanResult.event?.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77776F]">Seat:</span>
                    <span className="font-bold text-[#073F2E]">
                      Seat #{scanResult.ticket?.seatNumber} of {scanResult.ticket?.totalSeats}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77776F]">Booking Ref:</span>
                    <span className="font-mono text-[#171915]">
                      {scanResult.ticket?.booking?.bookingRef}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCheckingIn}
                  onClick={() => handleConfirmAdmission(scanResult.ticket?._id)}
                  className="btn-forest w-full py-3.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isCheckingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Admission Check-In</span>
                </button>
              </div>
            )}

            {/* State C: Verification Failed / Invalid / Already Checked In / Event Mismatch */}
            {scanResult && !scanResult.valid && (
              <div
                className={`border-2 rounded-2xl p-6 space-y-4 ${
                  scanResult.code === "ALREADY_CHECKED_IN"
                    ? "bg-amber-50 border-amber-400 text-amber-950"
                    : "bg-rose-50 border-rose-400 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  {scanResult.code === "ALREADY_CHECKED_IN" ? (
                    <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-700 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-serif text-lg font-bold">
                      {scanResult.code === "ALREADY_CHECKED_IN"
                        ? "Duplicate Admission Prevented"
                        : scanResult.code === "EVENT_MISMATCH"
                        ? "Event Mismatch"
                        : "Admission Denied"}
                    </h3>
                    <p className="text-xs mt-0.5 leading-relaxed">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.ticket && (
                  <div className="bg-white/80 rounded-xl p-3 text-xs space-y-1 border border-current/20">
                    <p>
                      <strong>Attendee:</strong> {scanResult.ticket.attendeeName}
                    </p>
                    <p>
                      <strong>Pass Code:</strong> {scanResult.ticket.ticketCode}
                    </p>
                    {scanResult.checkedInAt && (
                      <p className="text-amber-800 font-semibold">
                        Checked in on: {new Date(scanResult.checkedInAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="w-full py-2 rounded-full text-xs font-semibold bg-white border border-current/20 hover:bg-black/5 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* State D: Idle Prompt */}
            {!scanResult && !checkInSuccess && (
              <div className="py-12 text-center text-[#77776F] space-y-2">
                <ShieldCheck className="w-10 h-10 text-[#A9C3A0] mx-auto" />
                <p className="text-xs font-medium text-[#171915]">
                  Awaiting Scanned QR or Code Entry
                </p>
                <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
                  Scan a digital pass with your device camera or enter a reference code to begin validation.
                </p>
              </div>
            )}
          </div>

          {/* Session Check-In Log */}
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#073F2E]" />
              <h3 className="font-serif text-base font-bold text-[#171915]">
                Recent Admitted Attendees ({checkInHistory.length})
              </h3>
            </div>

            {checkInHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {checkInHistory.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E2D8] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#171915] block">
                        {item.attendeeName} (Seat #{item.seatNumber})
                      </span>
                      <span className="text-[11px] text-[#77776F] block truncate max-w-[200px]">
                        {item.eventTitle}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-mono text-[#073F2E] font-bold block">
                        {item.ticketCode}
                      </span>
                      <span className="text-[10px] text-[#77776F]">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#77776F] italic text-center py-4">
                No check-ins recorded yet during this admin session.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
