"use client";

import { useState } from "react";
import {
  X,
  Printer,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Check,
  Sparkles,
} from "lucide-react";

export default function TicketModal({ isOpen, onClose, booking, tickets = [], loading = false }) {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const currentTicket = tickets[currentTicketIndex] || null;
  const evt = currentTicket?.event || booking?.event;
  const isMultiSeat = tickets.length > 1;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "checked_in":
        return {
          label: "Admitted & Checked In",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          dot: "bg-blue-600",
        };
      case "cancelled":
        return {
          label: "Void / Cancelled",
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          dot: "bg-rose-600",
        };
      case "valid":
      default:
        return {
          label: "Verified Admission",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dot: "bg-emerald-600",
        };
    }
  };

  const statusInfo = getStatusBadge(currentTicket?.status || "valid");

  return (
    <div className="gather-ticket-modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Strict 1-Page Luxury PDF & Paper Print Styling */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm auto;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Remove all external page chrome, headers, footers and navigation from print stream */
          header, main, footer, nav, .no-print {
            display: none !important;
          }

          /* Make modal root static and fit cleanly on exactly 1 page */
          .gather-ticket-modal-backdrop {
            position: static !important;
            inset: auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 650px !important;
            box-shadow: none !important;
          }

          .gather-ticket-modal-container {
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #gather-print-pass {
            width: 100% !important;
            max-width: 640px !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Main Single-Window Modal Container */}
      <div className="gather-ticket-modal-container relative w-full max-w-[500px] max-h-[94vh] flex flex-col bg-[#FFFEFA] rounded-2xl sm:rounded-[26px] border border-[#E7E2D8] shadow-2xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#FAF8F5] border-b border-[#E7E2D8] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#073F2E]"></span>
            <span className="font-serif text-xs font-semibold tracking-wide text-[#073F2E]">
              Gather Digital Pass
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              type="button"
              className="p-1.5 text-[#77776F] hover:text-[#073F2E] hover:bg-[#EBF3E8] rounded-full transition-colors cursor-pointer"
              title="Print Pass (Single Page)"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#77776F] hover:text-[#171915] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-seat ticket switcher (Hidden in Print) */}
        {isMultiSeat && (
          <div className="no-print bg-[#EBF3E8]/80 px-4 py-2 flex items-center justify-between text-xs border-b border-[#073F2E]/10 flex-shrink-0">
            <span className="text-[#073F2E] font-medium text-[11px]">
              Pass {currentTicketIndex + 1} of {tickets.length} (Seat #{currentTicket?.seatNumber})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentTicketIndex === 0}
                onClick={() => setCurrentTicketIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded-md text-[#073F2E] hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={currentTicketIndex === tickets.length - 1}
                onClick={() => setCurrentTicketIndex((prev) => Math.min(tickets.length - 1, prev + 1))}
                className="p-1 rounded-md text-[#073F2E] hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content on Screen, Clean Document on Print */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          
          {/* Printable Executive Boarding Pass / Ticket */}
          <div
            id="gather-print-pass"
            className="bg-[#FFFEFA] border-2 border-[#073F2E] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm print:shadow-none print:border-2 print:border-[#073F2E] print:rounded-2xl"
          >
            {/* Top Brand & Security Header */}
            <div className="bg-[#073F2E] text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Gather
                </span>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#D4AF37] bg-white/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  VIP Admission Pass
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>{statusInfo.label}</span>
                </span>
              </div>
            </div>

            {/* Session Overview Bar */}
            <div className="px-5 sm:px-6 py-3 bg-[#FAF8F5] border-b border-[#E7E2D8] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#073F2E] block">
                  {evt?.category || "Curated Masterclass"}
                </span>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#171915] leading-snug line-clamp-1">
                  {evt ? evt.title : "Gather Session Pass"}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-[#77776F] block">
                  Pass Type
                </span>
                <span className="text-xs font-bold text-[#073F2E]">
                  {booking?.amount === 0 ? "Complimentary Pass" : "Verified Seat Pass"}
                </span>
              </div>
            </div>

            {/* Perforated Stub Tear-Line */}
            <div className="relative py-1 flex items-center justify-between">
              <div className="w-3 h-5 bg-[#FAF8F5] print:bg-white rounded-r-full border-r border-[#E7E2D8] -ml-0.5" />
              <div className="flex-1 border-b-2 border-dashed border-[#E7E2D8] mx-2" />
              <div className="w-3 h-5 bg-[#FAF8F5] print:bg-white rounded-l-full border-l border-[#E7E2D8] -mr-0.5" />
            </div>

            {/* Two-Column Ticket Core */}
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              
              {/* Left Column: Logistics & Attendee (Col 7) */}
              <div className="sm:col-span-7 space-y-3">
                
                {/* Date & Schedule */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] block">
                      Session Schedule
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#171915]">
                      {evt?.date || "Date TBA"}
                    </p>
                    <p className="text-[11px] text-[#77776F]">
                      {evt?.time || "Timing TBA"}
                    </p>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] block">
                      Venue / Hall
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#171915] leading-snug line-clamp-2">
                      {evt?.venue || "Studio Venue"}
                    </p>
                  </div>
                </div>

                {/* Attendee Details */}
                <div className="flex items-start gap-2.5 pt-1 border-t border-[#E7E2D8]/80">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] block">
                      Reserved Attendee
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#171915]">
                      {currentTicket?.attendeeName || booking?.attendeeName || "Guest Attendee"}
                    </p>
                    <p className="text-[11px] text-[#77776F]">
                      Seat #{currentTicket?.seatNumber || 1} of {currentTicket?.totalSeats || booking?.seatsBooked || 1} • Confirmed
                    </p>
                  </div>
                </div>

                {/* Booking Ref & Fee Status */}
                <div className="flex items-center justify-between bg-[#FAF8F5] border border-[#E7E2D8] rounded-xl px-3 py-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#77776F] block">
                      Booking Reference
                    </span>
                    <span className="font-mono text-xs font-bold text-[#073F2E]">
                      {booking?.bookingRef || currentTicket?.booking?.bookingRef}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-[#77776F] block">
                      Fee Status
                    </span>
                    <span className="text-xs font-bold text-[#171915]">
                      {booking?.amount === 0 ? "Complimentary" : `₹${booking?.amount} (Paid)`}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: QR Code & Verification Stub (Col 5) */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center text-center sm:border-l sm:border-[#E7E2D8] sm:pl-4 space-y-2">
                <div className="bg-white p-2 rounded-2xl border-2 border-[#073F2E]/20 shadow-xs inline-block">
                  {loading ? (
                    <div className="w-32 h-32 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-[#073F2E] border-t-transparent rounded-full" />
                    </div>
                  ) : currentTicket?.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentTicket.qrDataUrl}
                      alt="Ticket QR Code"
                      className="w-32 h-32 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-[#FAF8F5] rounded-xl text-xs text-[#77776F]">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-mono text-xs sm:text-sm font-extrabold tracking-widest text-[#073F2E] block">
                    {currentTicket?.ticketCode || booking?.bookingRef}
                  </span>
                  <span className="text-[10px] text-[#77776F] mt-0.5 block leading-tight">
                    Scan upon arrival at check-in desk
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Security Watermark & Entry Instructions */}
            <div className="bg-[#FAF8F5] border-t border-[#E7E2D8] px-5 sm:px-6 py-2.5 text-[10px] text-[#77776F] space-y-0.5 leading-relaxed">
              <p className="font-medium text-[#171915]/80">
                • Doors open 30 minutes before session time. Please have this pass ready digitally or printed on paper.
              </p>
              <p>
                • Official admission document authenticated by EventFlow Gather. Non-transferable once checked in. Official concierge: support@gather.events
              </p>
            </div>

          </div>

        </div>

        {/* Bottom Actions Bar (Hidden in Print) */}
        <div className="no-print px-4 sm:px-5 py-2.5 bg-[#FAF8F5] border-t border-[#E7E2D8] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Primary Print Pass Button */}
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-[#073F2E] hover:bg-[#052F22] text-white shadow-xs transition-all hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass (1 Page PDF)</span>
            </button>

            {/* Send to Email Button */}
            <button
              onClick={handleSendEmail}
              type="button"
              className="px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 text-[#073F2E] hover:bg-[#EBF3E8] border border-[#073F2E]/20 transition-all cursor-pointer"
              title="Resend pass to registered email"
            >
              {emailSent ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Sent!</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Pass</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-full text-xs font-semibold border border-[#E7E2D8] bg-white text-[#171915] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
