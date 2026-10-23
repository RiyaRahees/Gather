"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import {
  Calendar,
  Users,
  CreditCard,
  UserCheck,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  MoreVertical,
  Wallet,
  Receipt,
  IndianRupee,
  TrendingUp,
  Check,
  Activity,
  Sparkles,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("This Month");
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [activePointIndex, setActivePointIndex] = useState(null); // dynamically focus on real peak
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All Events");
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleAdminLogout = async () => {
    try {
      await logout();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, authLoading, isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const [statsRes, eventsRes, paymentsRes] = await Promise.all([
        fetch(getApiUrl("/api/admin/stats"), { headers, credentials: "include" }),
        fetch(getApiUrl("/api/events?limit=5"), { headers, credentials: "include" }),
        fetch(getApiUrl("/api/admin/payments"), { headers, credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentBookings(statsData.recentBookings || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setUpcomingEvents(eventsData.events || []);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-14 text-[#171915]">
      {/* Top Bar matching exact mockup */}
      <div className="h-16 sm:h-20 px-4 sm:px-6 lg:px-8 border-b border-[#E7E2D8] bg-[#FAF8F5] flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E7E2D8] flex-1 max-w-[170px] sm:max-w-xs md:max-w-sm shadow-xs">
          <Search className="w-4 h-4 text-[#77776F] shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs w-full text-[#171915] placeholder-[#77776F] focus:outline-none"
          />
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Range Selector */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E7E2D8] text-xs font-medium text-[#171915] shadow-xs cursor-pointer hover:bg-white/80 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#77776F]" />
            <span>Oct 1, 2026 – Oct 31, 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#77776F]" />
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative p-2 sm:p-2.5 rounded-xl bg-white border border-[#E7E2D8] text-[#77776F] hover:text-[#171915] shadow-xs cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User Profile Pill with Interactive Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-xl bg-white border border-[#E7E2D8] text-xs font-semibold text-[#171915] shadow-xs cursor-pointer hover:bg-white/80 transition-colors"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0E3B2E] text-white flex items-center justify-center text-xs font-bold font-numeric">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown className={`w-3 h-3 text-[#77776F] transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E7E2D8] shadow-xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8]/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#171915] truncate">
                        {user?.name || "Administrator"}
                      </p>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#0E4935] bg-[#E8F8F0] px-1.5 py-0.5 rounded-md">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-[#77776F] font-mono truncate">
                      {user?.email || "admin@gmail.com"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/"
                      target="_blank"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#171915] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <span>Open Live Catalogue</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#77776F]" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleAdminLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-7">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#171915]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#77776F] mt-1">
            Everything for the Gather catalogue, attendee registrations, and revenue in one place.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Metric KPI Cards matching Events page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Registered Accounts */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Registered accounts</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                {stats?.totalUsers ?? 2}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                <span>↗</span>
                <span>Active community members</span>
              </div>
            </div>
          </div>

          {/* Card 2: Catalogue Events */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Catalogue events</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                {stats?.totalEvents ?? 0}
              </div>
              <div className="text-[11px] text-[#77776F]">Live &amp; scheduled sessions</div>
            </div>
          </div>

          {/* Card 3: Confirmed Bookings */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Confirmed bookings</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                {stats?.totalConfirmedBookings ?? 1}
              </div>
              <div className="text-[11px] text-[#77776F]">Seats reserved by attendees</div>
            </div>
          </div>

          {/* Card 4: Collected Revenue */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Collected revenue</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                ₹{(stats?.totalCollectedRevenue ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-[#77776F]">Verified transactions</div>
            </div>
          </div>
        </div>

        {/* Charts Row: Revenue Overview Area Chart & Event Distribution Donut */}
        {(() => {
          // Compute REAL dynamic dataset from actual confirmed payments in database
          const confirmedPayments = (payments || []).filter(
            (p) => p.paymentStatus === "completed" && p.bookingStatus === "confirmed"
          );

          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          const buildTimeframeData = (mode) => {
            let buckets = [];
            let label = "";

            if (mode === "Last 7 Days") {
              label = "Last 7 Days Activity";
              for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const dayStr = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
                const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                buckets.push({
                  key: d.toISOString().split("T")[0],
                  dateObj: d,
                  date: dayStr,
                  fullDate,
                  revenue: 0,
                  bookings: 0,
                });
              }
            } else if (mode === "Last 30 Days") {
              label = "Last 30 Days Activity";
              for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i * 5);
                d.setHours(0, 0, 0, 0);
                const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                buckets.push({
                  dateObj: d,
                  date: dayStr,
                  fullDate,
                  revenue: 0,
                  bookings: 0,
                });
              }
            } else {
              // "This Month"
              const monthName = now.toLocaleDateString("en-US", { month: "short" });
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              label = `${monthName} 1 – ${monthName} ${daysInMonth}, ${currentYear}`;

              // Identify all days in this month that have real payments
              const paymentDays = new Set(
                confirmedPayments
                  .map((p) => new Date(p.createdAt))
                  .filter((d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth)
                  .map((d) => d.getDate())
              );

              // Standard baseline milestones plus real activity days
              const milestoneDays = [1, 5, 10, 15, 20, 25, daysInMonth];
              paymentDays.forEach((d) => {
                if (!milestoneDays.includes(d)) milestoneDays.push(d);
              });
              milestoneDays.sort((a, b) => a - b);

              const selectedDays = milestoneDays.length <= 8
                ? milestoneDays
                : [1, 5, 10, 15, ...Array.from(paymentDays), daysInMonth].sort((a, b) => a - b).slice(0, 8);

              selectedDays.forEach((day) => {
                const d = new Date(currentYear, currentMonth, day, 0, 0, 0, 0);
                const dayStr = `${monthName} ${day}`;
                const fullDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                buckets.push({
                  dayNumber: day,
                  dateObj: d,
                  date: dayStr,
                  fullDate,
                  revenue: 0,
                  bookings: 0,
                });
              });
            }

            // Aggregate payments into buckets
            confirmedPayments.forEach((p) => {
              const pDate = new Date(p.createdAt);
              if (isNaN(pDate.getTime())) return;

              if (mode === "This Month") {
                const pDay = pDate.getDate();
                let target = buckets.find((b) => b.dayNumber === pDay);
                if (!target) {
                  let closest = buckets[0];
                  let minDiff = Math.abs(closest.dayNumber - pDay);
                  buckets.forEach((b) => {
                    const diff = Math.abs(b.dayNumber - pDay);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = b;
                    }
                  });
                  target = closest;
                }
                target.revenue += p.amount || 0;
                target.bookings += 1;
              } else if (mode === "Last 7 Days") {
                const pKey = pDate.toISOString().split("T")[0];
                let target = buckets.find((b) => b.key === pKey);
                if (target) {
                  target.revenue += p.amount || 0;
                  target.bookings += 1;
                }
              } else {
                let closest = buckets[0];
                let minDiff = Math.abs(closest.dateObj.getTime() - pDate.getTime());
                buckets.forEach((b) => {
                  const diff = Math.abs(b.dateObj.getTime() - pDate.getTime());
                  if (diff < minDiff) {
                    minDiff = diff;
                    closest = b;
                  }
                });
                if (minDiff < 5 * 86400000) {
                  closest.revenue += p.amount || 0;
                  closest.bookings += 1;
                }
              }
            });

            const totalRevenue = buckets.reduce((acc, b) => acc + b.revenue, 0);
            const peakRevenue = Math.max(...buckets.map((b) => b.revenue), 1000);
            const ceilMax = Math.max(1000, Math.ceil(peakRevenue / 1000) * 1000);

            const stepX = (525 - 55) / (buckets.length - 1 || 1);
            const points = buckets.map((b, idx) => {
              const x = Math.round(55 + idx * stepX);
              const ratio = ceilMax > 0 ? b.revenue / ceilMax : 0;
              const y = Math.round(155 - ratio * 130);
              const prevRev = idx > 0 ? buckets[idx - 1].revenue : 0;
              const diff = b.revenue - prevRev;
              const growth = idx === 0
                ? "Baseline"
                : diff > 0
                ? `+₹${diff.toLocaleString("en-IN")}`
                : diff < 0
                ? `-₹${Math.abs(diff).toLocaleString("en-IN")}`
                : "0%";

              return {
                x,
                y,
                date: b.date,
                fullDate: b.fullDate,
                amount: `₹${b.revenue.toLocaleString("en-IN")}`,
                rawAmount: b.revenue,
                bookings: b.bookings,
                growth,
              };
            });

            // Smooth cubic Bezier spline path
            let linePath = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
              const p0 = points[i];
              const p1 = points[i + 1];
              const dx = p1.x - p0.x;
              const cp1x = p0.x + dx * 0.45;
              const cp1y = p0.y;
              const cp2x = p1.x - dx * 0.45;
              const cp2y = p1.y;
              linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x} ${p1.y}`;
            }
            const areaPath = `${linePath} L ${points[points.length - 1].x} 155 L ${points[0].x} 155 Z`;

            const yAxisTicks = [
              { y: 25, label: `₹${ceilMax.toLocaleString("en-IN")}` },
              { y: 58, label: `₹${Math.round(ceilMax * 0.75).toLocaleString("en-IN")}` },
              { y: 90, label: `₹${Math.round(ceilMax * 0.5).toLocaleString("en-IN")}` },
              { y: 122, label: `₹${Math.round(ceilMax * 0.25).toLocaleString("en-IN")}` },
              { y: 155, label: "₹0" },
            ];

            return {
              label,
              periodTotal: `₹${totalRevenue.toLocaleString("en-IN")}`,
              points,
              linePath,
              areaPath,
              yAxisTicks,
              ceilMax,
            };
          };

          const timeframeData = {
            "This Month": buildTimeframeData("This Month"),
            "Last 30 Days": buildTimeframeData("Last 30 Days"),
            "Last 7 Days": buildTimeframeData("Last 7 Days"),
          };

          const currentDataset = timeframeData[selectedTimeframe] || timeframeData["This Month"];
          const peakPointIdx = currentDataset.points.reduce(
            (maxI, pt, curI, arr) => (pt.rawAmount >= arr[maxI].rawAmount ? curI : maxI),
            0
          );
          const currentActiveIdx = activePointIndex !== null && activePointIndex < currentDataset.points.length
            ? activePointIndex
            : peakPointIdx;
          const activePt = currentDataset.points[currentActiveIdx] || currentDataset.points[0];

          const totalCatalogueEvents = stats?.totalEvents ?? 0;
          const dynamicCategoryCounts = stats?.categoryCounts || {};

          const categoryDefinitions = [
            { id: "technology", name: "Technology", color: "#60A5FA" },
            { id: "design", name: "Design", color: "#7FE5B8" },
            { id: "business", name: "Business", color: "#FBBF24" },
            { id: "marketing", name: "Marketing", color: "#C084FC" },
            { id: "creative", name: "Creative Arts", color: "#F472B6" },
            { id: "personal", name: "Personal Growth", color: "#34D399" },
          ];

          const CIRCUMFERENCE = 289;
          let runningOffset = 0;

          const categoriesList = categoryDefinitions.map((def) => {
            const count = dynamicCategoryCounts[def.name] || 0;
            const pctVal = totalCatalogueEvents > 0 ? (count / totalCatalogueEvents) : 0;
            const pctStr = `${Math.round(pctVal * 100)}%`;
            const arcLength = Math.max(0, Math.round(pctVal * CIRCUMFERENCE));
            const gapLength = CIRCUMFERENCE - arcLength;
            const dasharray = `${arcLength} ${gapLength}`;
            const dashoffset = `${-runningOffset}`;
            if (arcLength > 0) {
              runningOffset += arcLength;
            }

            return {
              id: def.id,
              name: def.name,
              color: def.color,
              count,
              percentage: pctStr,
              dasharray,
              dashoffset,
              barWidth: pctStr,
            };
          });

          const activeHoveredCat = categoriesList.find((c) => c.name === hoveredCategory);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Revenue Overview (Area Spline Chart) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-[#171915]">
                        Revenue Overview
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8F0] text-[#065F46] border border-[#A7F3D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        Live Sync
                      </span>
                    </div>
                    <p className="text-xs text-[#77776F]">
                      Total verified collected revenue • {currentDataset.label}
                    </p>
                  </div>

                  {/* Timeframe Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E2D8] bg-white text-xs font-semibold text-[#171915] cursor-pointer hover:bg-[#FAF8F5] shadow-2xs transition-colors"
                    >
                      <span>{selectedTimeframe}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#77776F] transition-transform duration-200 ${
                          isTimeframeOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isTimeframeOpen && (
                      <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#E7E2D8] shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {["This Month", "Last 30 Days", "Last 7 Days"].map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => {
                              setSelectedTimeframe(tf);
                              setIsTimeframeOpen(false);
                              setActivePointIndex(null);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer text-[#171915]"
                          >
                            <span className={selectedTimeframe === tf ? "font-bold text-[#064E3B]" : "font-normal"}>
                              {tf}
                            </span>
                            {selectedTimeframe === tf && (
                              <Check className="w-3.5 h-3.5 text-[#064E3B]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom SVG Spline Chart with realistic curves, drop glow, laser crosshair, and floating glassmorphism tooltip */}
                <div className="relative pt-2 select-none">
                  {/* Floating Realistic Glassmorphism Tooltip */}
                  {activePt && (
                    <div
                      className="absolute z-20 pointer-events-none transition-all duration-150 transform"
                      style={{
                        left: `${(activePt.x / 540) * 100}%`,
                        top: `${(activePt.y / 185) * 100}%`,
                        transform: `translate(${activePt.x > 380 ? "-85%" : activePt.x < 120 ? "-15%" : "-50%"}, -105%)`,
                      }}
                    >
                      <div className="bg-[#0B3326]/95 backdrop-blur-md text-white border border-[#10B981]/30 rounded-xl px-3.5 py-2 shadow-xl shadow-[#06291E]/20 text-xs min-w-[145px]">
                        <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10 text-[10px] text-white/70">
                          <span className="font-medium">{activePt.fullDate}</span>
                          <span className="font-bold text-[#34D399] font-numeric">{activePt.growth}</span>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 mt-1.5">
                          <span className="text-[11px] text-white/60">Revenue:</span>
                          <span className="text-sm font-bold text-white font-numeric tracking-tight">{activePt.amount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/60 mt-0.5">
                          <span>Registrations:</span>
                          <span className="font-semibold text-white/90 font-numeric">{activePt.bookings} bookings</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <svg viewBox="0 0 540 185" className="w-full h-44 overflow-visible">
                    <defs>
                      {/* Multi-stop rich area gradient */}
                      <linearGradient id="areaGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                        <stop offset="45%" stopColor="#10B981" stopOpacity="0.14" />
                        <stop offset="85%" stopColor="#34D399" stopOpacity="0.03" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>

                      {/* Drop shadow / glow filter for the spline curve */}
                      <filter id="splineGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#047857" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Dynamic Horizontal Guide Lines */}
                    {currentDataset.yAxisTicks.map((tick, tIdx) => (
                      <line
                        key={`line-${tIdx}`}
                        x1="45"
                        y1={tick.y}
                        x2="530"
                        y2={tick.y}
                        stroke="#F0EDE4"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    ))}

                    {/* Dynamic Y-Axis Labels */}
                    {currentDataset.yAxisTicks.map((tick, tIdx) => (
                      <text
                        key={`text-${tIdx}`}
                        x="38"
                        y={tick.y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-[#77776F] font-numeric"
                      >
                        {tick.label}
                      </text>
                    ))}

                    {/* Area Gradient Fill */}
                    <path
                      d={currentDataset.areaPath}
                      fill="url(#areaGreenGrad)"
                      className="transition-all duration-300"
                    />

                    {/* Spline Line with Ambient Drop Shadow Glow */}
                    <path
                      d={currentDataset.linePath}
                      fill="none"
                      stroke="#064E3B"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      filter="url(#splineGlow)"
                      className="transition-all duration-300"
                    />

                    {/* Vertical Laser Tracking Line for Active Point */}
                    {activePt && (
                      <line
                        x1={activePt.x}
                        y1="20"
                        x2={activePt.x}
                        y2="155"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.75"
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Dot Markers & Interactive Hit Targets */}
                    {currentDataset.points.map((pt, idx) => {
                      const isActive = activePointIndex === idx;
                      return (
                        <g key={pt.date} className="cursor-pointer" onMouseEnter={() => setActivePointIndex(idx)}>
                          {/* Pulsing halo ring for active node */}
                          {isActive && (
                            <>
                              <circle cx={pt.x} cy={pt.y} r="10" fill="#10B981" opacity="0.25" className="animate-ping" />
                              <circle cx={pt.x} cy={pt.y} r="6.5" fill="#10B981" opacity="0.3" />
                            </>
                          )}
                          {/* Main node dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isActive ? "5" : "3.5"}
                            fill={isActive ? "#064E3B" : "#064E3B"}
                            stroke="#ffffff"
                            strokeWidth={isActive ? "2.5" : "1.5"}
                            className="transition-all duration-150"
                          />
                          {/* Invisible larger hover hit target */}
                          <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
                        </g>
                      );
                    })}

                    {/* X-Axis Labels */}
                    {currentDataset.points.map((pt, idx) => (
                      <text
                        key={pt.date}
                        x={pt.x}
                        y="175"
                        textAnchor="middle"
                        className={`text-[10px] font-numeric cursor-pointer transition-colors ${
                          activePointIndex === idx ? "fill-[#064E3B] font-bold" : "fill-[#77776F]"
                        }`}
                        onMouseEnter={() => setActivePointIndex(idx)}
                      >
                        {pt.date}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Event Distribution (Donut Chart & Legend) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#171915]">
                      Event Distribution
                    </h3>
                    <p className="text-xs text-[#77776F]">Events by category</p>
                  </div>

                  {/* Category Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E2D8] bg-white text-xs font-semibold text-[#171915] cursor-pointer hover:bg-[#FAF8F5] shadow-2xs transition-colors"
                    >
                      <span>{categoryFilter}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#77776F] transition-transform duration-200 ${
                          isCategoryFilterOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isCategoryFilterOpen && (
                      <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-[#E7E2D8] shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {["All Events", "Published Events", "Draft Sessions"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(opt);
                              setIsCategoryFilterOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer text-[#171915]"
                          >
                            <span className={categoryFilter === opt ? "font-bold text-[#064E3B]" : "font-normal"}>
                              {opt}
                            </span>
                            {categoryFilter === opt && (
                              <Check className="w-3.5 h-3.5 text-[#064E3B]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 pt-2">
                  {/* Donut SVG with Interactive Segment Highlights */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      {categoriesList.map((item) => {
                        const isHovered = hoveredCategory === item.name;
                        const hasOtherHover = hoveredCategory && !isHovered;
                        return (
                          <circle
                            key={item.id}
                            cx="60"
                            cy="60"
                            r="46"
                            fill="none"
                            stroke={item.color}
                            strokeWidth={isHovered ? "17" : "14"}
                            strokeDasharray={item.dasharray}
                            strokeDashoffset={item.dashoffset}
                            opacity={hasOtherHover ? 0.35 : 1}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => setHoveredCategory(item.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })}
                    </svg>

                    {/* Dynamic Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                      {activeHoveredCat ? (
                        <>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#064E3B] max-w-[80px] truncate">
                            {activeHoveredCat.name}
                          </span>
                          <span className="text-xl font-bold font-numeric text-[#171915] leading-none mt-0.5">
                            {activeHoveredCat.count}
                          </span>
                          <span className="text-[9px] font-semibold text-[#10B981] font-numeric mt-0.5">
                            {activeHoveredCat.percentage}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold font-numeric text-[#171915] leading-none">
                            {stats?.totalEvents ?? 0}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] mt-0.5">
                            Events
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Interactive Legend with Micro Progress Bars and Category Hover */}
                  <div className="w-full sm:flex-1 space-y-1.5 text-xs">
                    {categoriesList.map((item) => {
                      const isHovered = hoveredCategory === item.name;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredCategory(item.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={`flex items-center justify-between p-1 rounded-lg transition-all cursor-pointer ${
                            isHovered ? "bg-[#F3EFE6]/80 -translate-x-0.5" : "hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                              style={{
                                backgroundColor: item.color,
                                transform: isHovered ? "scale(1.25)" : "scale(1)",
                              }}
                            />
                            <span
                              className={`text-xs truncate transition-colors ${
                                isHovered ? "text-[#064E3B] font-bold" : "text-[#171915] font-medium"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-[#171915] font-numeric text-xs">
                              {item.count}
                            </span>
                            <span className="text-[11px] text-[#77776F] w-8 text-right font-numeric">
                              {item.percentage}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Row 3: Recent Attendee Registrations Table Card */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#171915]">
                Recent Attendee Registrations
              </h3>
              <p className="text-xs text-[#77776F]">
                Latest bookings across all workshops and sessions.
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-[#073F2E] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View all attendees</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Booking Ref</th>
                  <th className="py-3 px-4 font-bold">Attendee</th>
                  <th className="py-3 px-4 font-bold">Event</th>
                  <th className="py-3 px-4 font-bold">Seats</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D8]/60">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#171915]">
                        {b.bookingRef || "EF-DEMO-7721"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {b.attendeeName ? b.attendeeName.charAt(0).toUpperCase() : "R"}
                          </div>
                          <div>
                            <span className="font-semibold text-[#171915] block">
                              {b.attendeeName || "Riya Rahees"}
                            </span>
                            <span className="text-[#77776F] text-[11px] block">
                              {b.attendeeEmail || "riya@eventflow.dev"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#171915] max-w-xs truncate">
                        {b.event?.title || "Creative Coding with WebGL & Shaders"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#171915]">
                        {b.seatsBooked || 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#171915]">
                        {b.amount === 0 ? (
                          <span className="text-[#171915]">Free</span>
                        ) : (
                          <span className="inline-flex items-center font-sans font-semibold text-[#171915]">
                            <IndianRupee className="w-3.5 h-3.5 text-[#073F2E] stroke-[2.5] mr-0.5 shrink-0" />
                            {Number(b.amount).toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#DCFCE7] text-[#15803D]">
                          {b.bookingStatus ? b.bookingStatus.toUpperCase() : "CONFIRMED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#77776F]">
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleDateString("en-US")
                          : "10/20/2026"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1 text-[#77776F] hover:text-[#171915] rounded hover:bg-[#FAF8F5]">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Demonstration row matching mockup */
                  <tr className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#171915]">
                      EF-DEMO-7721
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          R
                        </div>
                        <div>
                          <span className="font-semibold text-[#171915] block">Riya Rahees</span>
                          <span className="text-[#77776F] text-[11px] block">riya@eventflow.dev</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#171915] max-w-xs truncate">
                      Creative Coding with WebGL & Shaders
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#171915]">1</td>
                    <td className="py-3.5 px-4 font-semibold text-[#171915]">Free</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#DCFCE7] text-[#15803D]">
                        CONFIRMED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#77776F]">10/20/2026</td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1 text-[#77776F] hover:text-[#171915] rounded hover:bg-[#FAF8F5]">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Bottom 2-Card Row matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs flex flex-col h-[380px]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E7E2D8]/60 shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-[#171915]">
                  Upcoming Events
                </h3>
                <p className="text-xs text-[#77776F]">
                  Next scheduled workshops and conferences.
                </p>
              </div>
              <Link
                href="/admin/events"
                className="text-xs font-semibold text-[#073F2E] hover:underline flex items-center gap-1"
              >
                <span>View all events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white z-10 shadow-2xs">
                  <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold bg-white">Event Name</th>
                    <th className="py-2.5 px-3 font-bold bg-white">Date</th>
                    <th className="py-2.5 px-3 font-bold bg-white">Type</th>
                    <th className="py-2.5 px-3 font-bold bg-white">Attendees</th>
                    <th className="py-2.5 px-3 font-bold bg-white">Status</th>
                    <th className="py-2.5 px-3 font-bold text-right bg-white"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D8]/60">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((evt) => (
                      <tr key={evt._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#FAF8F5] relative shrink-0">
                              <Image
                                src={evt.image || "/images/event-creative-coding.jpg"}
                                alt={evt.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="font-semibold text-[#171915] truncate max-w-[130px]">
                              {evt.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#77776F] whitespace-nowrap">
                          <div>{evt.date || "Oct 25, 2026"}</div>
                          <div className="text-[10px]">{evt.time || "10:00 AM"}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9]">
                            {evt.category || "Workshop"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-[#171915]">
                            {(evt.totalSeats || 50) - (evt.availableSeats || 49)} / {evt.totalSeats || 50}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#15803D]">
                            {evt.isPublished !== false ? "PUBLISHED" : "DRAFT"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button className="p-1 text-[#77776F] hover:text-[#171915]">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* Default representative row matching mockup */
                    <tr className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-purple-900 relative shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                            CC
                          </div>
                          <span className="font-semibold text-[#171915] truncate max-w-[140px]">
                            Creative Coding with WebGL & Shaders
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#77776F] whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-[#77776F]" />
                          <span>Oct 25, 2026</span>
                        </div>
                        <div className="text-[10px] pl-4 text-[#77776F]/80">10:00 AM</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EDE9FE] text-[#6D28D9]">
                          Workshop
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-[#171915]">
                          <span>1</span>
                          <span className="text-[#77776F]">/ 50</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#15803D]">
                          PUBLISHED
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1 text-[#77776F] hover:text-[#171915]">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-xs flex flex-col h-[380px]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E7E2D8]/60 shrink-0">
              <div>
                <h3 className="font-serif text-base font-bold text-[#171915]">
                  Recent Payments
                </h3>
                <p className="text-xs text-[#77776F]">
                  Latest verified transactions.
                </p>
              </div>
              <Link
                href="/admin/payments"
                className="text-xs font-semibold text-[#073F2E] hover:underline flex items-center gap-1"
              >
                <span>View all payments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white z-10 shadow-2xs">
                  <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 font-bold bg-white">BOOKING REF</th>
                    <th className="py-2.5 px-3 font-bold bg-white">ATTENDEE</th>
                    <th className="py-2.5 px-3 font-bold bg-white">AMOUNT</th>
                    <th className="py-2.5 px-3 font-bold bg-white">STATUS</th>
                    <th className="py-2.5 px-3 font-bold bg-white">DATE</th>
                  </tr>
                </thead>
                {payments.length > 0 && (
                  <tbody className="divide-y divide-[#E7E2D8]/60">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#073F2E]">
                          {p.bookingRef}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#171915]">
                          {p.attendeeName}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#171915] font-numeric">
                          {p.amount === 0 ? "Free" : `₹${p.amount.toLocaleString("en-IN")}`}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#77776F] font-numeric">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>

              {payments.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] flex items-center justify-center text-[#77776F] mb-2.5 shadow-xs">
                    <Receipt className="w-5 h-5 text-[#77776F]" />
                  </div>
                  <p className="text-xs font-semibold text-[#171915]">No payments yet</p>
                  <p className="text-[11px] text-[#77776F] mt-0.5">
                    Payments from event bookings will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
