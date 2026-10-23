"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  CreditCard,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  HelpCircle,
  ChevronDown,
  Building2,
  Tag,
  Send,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  "Design",
  "Technology",
  "Business",
  "Marketing",
  "Personal Growth",
  "Creative Arts",
];

const FAQS = [
  {
    q: "Who can host an event on Gather?",
    a: "Anyone with specialized craft knowledge—from design directors and AI engineers to indie creators and founders—can submit a workshop or meetup proposal. Our team reviews all proposals for quality and curriculum depth.",
  },
  {
    q: "How does ticketing and payouts work?",
    a: "Gather handles end-to-end Razorpay payments, automated receipting, digital PDF boarding passes, and live QR code door check-in. Curators receive transparent direct payouts following event completion.",
  },
  {
    q: "Can Gather help with physical venue booking?",
    a: "Yes! We maintain relationships with boutique studio spaces, tech amphitheaters, and creative hubs across Kochi, Bengaluru, and other major cities. We can pair your curriculum with the ideal physical space.",
  },
  {
    q: "Can I host a free community session?",
    a: "Absolutely. Gather fully supports free events with attendee cap enforcement and intelligent 2-hour waitlist queues to ensure every single seat is filled.",
  },
];

export default function HostWithGatherPage() {
  const { user, userToken, token } = useAuth();

  // Form State
  const [hostName, setHostName] = useState(user?.name || "");
  const [hostEmail, setHostEmail] = useState(user?.email || "");
  const [eventTitle, setEventTitle] = useState("");
  const [category, setCategory] = useState("Design");
  const [city, setCity] = useState("Kochi");
  const [format, setFormat] = useState("Studio Workshop (15–30 seats)");
  const [proposedPrice, setProposedPrice] = useState("499");
  const [description, setDescription] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Sync logged in user details if not yet typed
  useEffect(() => {
    if (user) {
      if (!hostName && user.name) setHostName(user.name);
      if (!hostEmail && user.email) setHostEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const activeToken =
      userToken ||
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("usertoken") || localStorage.getItem("token")
        : null);

    const headers = {
      "Content-Type": "application/json",
      ...(activeToken ? { "x-user-token": activeToken, Authorization: `Bearer ${activeToken}` } : {}),
    };

    try {
      const res = await fetch(getApiUrl("/api/proposals"), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          hostName,
          hostEmail,
          title: eventTitle,
          category,
          city,
          format,
          targetPrice: proposedPrice,
          description,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to submit your proposal. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Proposal submission error:", err);
      setErrorMsg(err.message || "Failed to submit proposal. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#171915]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-[#E7E2D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Copy */}
              <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3E8] border border-[#D5E3D2] text-[#073F2E] text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-[#073F2E]" />
                  <span>Curator Partnership Network</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#171915] leading-[1.12]">
                  Host a masterclass.
                  <br />
                  <span className="italic font-normal text-[#073F2E]">
                    Share your craft with Gather.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-[#77776F] leading-relaxed max-w-xl font-normal">
                  Whether you lead hands-on design clinics, deep technical coding sessions, or intimate founder roundtables, Gather gives you the seamless platform to teach, curate, and inspire an active community of 1,200+ practitioners.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <a
                    href="#proposal-form"
                    className="btn-forest px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide inline-flex items-center gap-2 shadow-sm"
                  >
                    <span>Submit an event proposal</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    href="/events"
                    className="btn-secondary px-6 py-3.5 rounded-full text-sm font-semibold"
                  >
                    Browse current catalogue
                  </Link>
                </div>

                {/* Social Proof Stats */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E7E2D8] max-w-lg">
                  <div>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#171915] block">
                      1,200+
                    </span>
                    <span className="text-[11px] text-[#77776F] mt-0.5 block">
                      Active learners
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#073F2E] block">
                      90%+
                    </span>
                    <span className="text-[11px] text-[#77776F] mt-0.5 block">
                      Curator revenue share
                    </span>
                  </div>
                  <div>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#171915] block">
                      24h
                    </span>
                    <span className="text-[11px] text-[#77776F] mt-0.5 block">
                      Review response
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Collage */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border-4 border-white">
                  <Image
                    src="/images/event-design-studio.jpg"
                    alt="Gather workshop host leading a design masterclass"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Testimonial Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#E7E2D8] shadow-lg">
                    <p className="text-xs text-[#171915] font-serif italic leading-relaxed">
                      &ldquo;Gather took care of the ticket check-ins, automated waitlists, and venue setup. Our design system session sold out in 48 hours.&rdquo;
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#171915]">DevOps Circle &amp; Studio</span>
                      <span className="text-[#073F2E] font-medium">Curator Partner</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4 Pillars Feature Cards */}
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block">
              WHY CURATE WITH GATHER
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#171915]">
              Everything you need to run high-caliber sessions.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#171915]">
                Curated Community
              </h3>
              <p className="text-xs text-[#77776F] leading-relaxed">
                Connect directly with serious learners who value craft, depth, and hands-on participation.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#171915]">
                Full-Stack Ticketing
              </h3>
              <p className="text-xs text-[#77776F] leading-relaxed">
                Seamless Razorpay checkout in INR, zero-fee free passes, and automated booking receipts.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#171915]">
                Door Check-In Scanner
              </h3>
              <p className="text-xs text-[#77776F] leading-relaxed">
                High-speed mobile camera QR verification and printable VIP passes with duplicate check protection.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#171915]">
                Venue Partnership
              </h3>
              <p className="text-xs text-[#77776F] leading-relaxed">
                Access boutique studio spaces and tech amphitheaters curated for intimate masterclass sessions.
              </p>
            </div>
          </div>
        </section>

        {/* 3 Step Workflow */}
        <section className="py-14 sm:py-20 bg-white border-y border-[#E7E2D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block">
                THE CURATION PROCESS
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#171915]">
                From concept to packed room in 3 simple steps.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D8] space-y-3 relative">
                <span className="w-8 h-8 rounded-full bg-[#073F2E] text-white text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <h4 className="font-serif text-lg font-bold text-[#171915]">
                  Pitch Your Session
                </h4>
                <p className="text-xs text-[#77776F] leading-relaxed">
                  Fill out the proposal form below detailing your workshop topic, target audience, and preferred dates.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D8] space-y-3 relative">
                <span className="w-8 h-8 rounded-full bg-[#073F2E] text-white text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="font-serif text-lg font-bold text-[#171915]">
                  Editorial Review &amp; Setup
                </h4>
                <p className="text-xs text-[#77776F] leading-relaxed">
                  Our team reviews your syllabus within 24 hours, configures venue requirements, and publishes your event page.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D8] space-y-3 relative">
                <span className="w-8 h-8 rounded-full bg-[#073F2E] text-white text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <h4 className="font-serif text-lg font-bold text-[#171915]">
                  Welcome Attendees
                </h4>
                <p className="text-xs text-[#77776F] leading-relaxed">
                  Track ticket sales in real-time, greet attendees at the door with camera QR check-in, and receive transparent payouts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Proposal Form Section */}
        <section id="proposal-form" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 sm:p-10 shadow-lg">
            
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#171915]">
                  Proposal Received!
                </h3>
                <p className="text-xs sm:text-sm text-[#77776F] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#171915]">{hostName}</strong>. Our Gather editorial team has received your concept for <strong className="text-[#073F2E]">&ldquo;{eventTitle || "your masterclass"}&rdquo;</strong> and will reach out to <strong className="text-[#171915]">{hostEmail}</strong> within 24 hours.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEventTitle("");
                      setDescription("");
                    }}
                    className="btn-secondary px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Submit another proposal
                  </button>
                  <Link
                    href="/"
                    className="btn-forest px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs"
                  >
                    Back to Gather Home
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="border-b border-[#E7E2D8] pb-6 mb-6">
                  <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#073F2E] block mb-1">
                    SUBMIT A PROPOSAL
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#171915]">
                    Tell us about your event concept
                  </h3>
                  <p className="text-xs text-[#77776F] mt-1">
                    We review submissions daily. No upfront fees are required to pitch or list.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  
                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Your Full Name <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Email Address <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={hostEmail}
                        onChange={(e) => setHostEmail(e.target.value)}
                        placeholder="sarah@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Title */}
                  <div>
                    <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                      Proposed Event Title <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g. Advanced Brand Identity & Typography Systems"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all"
                    />
                  </div>

                  {/* Row 3: Category & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Primary Discipline <span className="text-emerald-700">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Location / City <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Kochi, Bengaluru, or Online"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 4: Format & Target Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Target Session Format
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all cursor-pointer"
                      >
                        <option value="Studio Workshop (15–30 seats)">Studio Workshop (15–30 seats)</option>
                        <option value="Executive Masterclass (25–50 seats)">Executive Masterclass (25–50 seats)</option>
                        <option value="Community Meetup / Free (30–60 seats)">Community Meetup / Free (30–60 seats)</option>
                        <option value="Keynote Series (50+ seats)">Keynote Series (50+ seats)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Target Ticket Price (INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#77776F]">
                          ₹
                        </span>
                        <input
                          type="text"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          placeholder="499 (or 0 for free)"
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all font-numeric"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Description & Learning Outcomes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                      Session Overview &amp; Learning Outcomes <span className="text-emerald-700">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Give a brief summary of what you'll teach, who this session is for, prerequisites, and what projects or deliverables attendees will walk away with..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#171915] focus:outline-none focus:border-[#073F2E] transition-all"
                    />
                  </div>

                  {/* Submission CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[11px] text-[#77776F]">
                      By submitting, you agree to the Gather Curator Code of Conduct.
                    </p>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-forest px-8 py-3 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Sending proposal...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Session Proposal</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-14 sm:py-20 border-t border-[#E7E2D8]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#171915]">
                Common questions about hosting
              </h3>
            </div>

            <div className="space-y-3 pt-4">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-[#E7E2D8] bg-white overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-[#171915]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#77776F] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#073F2E]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs text-[#77776F] leading-relaxed border-t border-[#E7E2D8]/60 bg-[#FAF8F5]/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
