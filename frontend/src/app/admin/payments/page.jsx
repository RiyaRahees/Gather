"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Loader2,
  Receipt,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchPayments();
    }
  }, [user, authLoading, isAdmin, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-[#E7E2D8]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin/dashboard" className="text-xs text-[#77776F] hover:text-[#073F2E]">
                  ← Dashboard
                </Link>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#171915]">
                Payments & Financial Ledger
              </h1>
              <p className="text-xs text-[#77776F] mt-1">
                Financial transaction ledger, payment status audit, and collected revenue totals.
              </p>
            </div>

            <div className="flex items-center px-4 py-2 rounded-xl bg-white border border-[#E7E2D8] gap-2 self-start md:self-auto shadow-xs">
              <Filter className="w-4 h-4 text-[#77776F]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-[#171915] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Transactions</option>
                <option value="completed">Completed (Paid)</option>
                <option value="free">Free Registrations</option>
                <option value="pending">Pending Payment</option>
                <option value="failed">Failed / Cancelled</option>
              </select>
            </div>
          </div>

          {/* 4 Metric KPI Cards matching Events page */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Collected Revenue */}
              <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#77776F]">Collected revenue</div>
                  <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                    ₹{summary.successfulRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                    <span>↗</span>
                    <span>{summary.successfulCount} verified paid</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Records */}
              <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#77776F]">Total transactions</div>
                  <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                    {summary.totalTransactions}
                  </div>
                  <div className="text-[11px] text-[#77776F]">All recorded ledger events</div>
                </div>
              </div>

              {/* Card 3: Pending Order Amounts */}
              <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#77776F]">Pending checkouts</div>
                  <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                    ₹{summary.pendingRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#77776F]">Awaiting gateway capture</div>
                </div>
              </div>

              {/* Card 4: Free Admissions */}
              <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="text-xs font-medium text-[#77776F]">Free passes</div>
                  <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                    {summary.freeCount}
                  </div>
                  <div className="text-[11px] text-[#77776F]">Zero-cost confirmed seats</div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] p-4 sm:p-6 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-[#77776F]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#073F2E] mb-2" />
                <p className="text-xs">Loading ledger entries...</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-bold">Attendee</th>
                      <th className="py-3 px-4 font-bold">Event</th>
                      <th className="py-3 px-4 font-bold">Booking Ref</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Payment Status</th>
                      <th className="py-3 px-4 font-bold">Transaction Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E2D8]/60">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-[#F7F4ED]/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#171915]">
                          {p.attendeeName}
                          <span className="text-[11px] font-normal text-[#77776F] block">
                            {p.attendeeEmail}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#171915] max-w-xs truncate">
                          {p.event?.title || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#073F2E]">
                          {p.bookingRef}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#171915] font-numeric">
                          {p.amount === 0 ? "Free" : `₹${p.amount.toLocaleString("en-IN")}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1.5 ${
                              p.paymentStatus === "completed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : p.paymentStatus === "free"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : p.paymentStatus === "pending"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.paymentStatus === "completed"
                                  ? "bg-emerald-500"
                                  : p.paymentStatus === "free"
                                  ? "bg-blue-500"
                                  : p.paymentStatus === "pending"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#77776F] text-[11px] font-medium">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[#77776F]">
                <p className="text-sm">No transaction records match the filter.</p>
              </div>
            )}
          </div>

      </div>
  );
}
