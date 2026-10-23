"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { Users, Search, Shield, User, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchUsers();
    }
  }, [user, authLoading, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);

      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch("/api/admin/users", {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const totalUsers = users.length;
  const regularUsers = users.filter((u) => u.role === "user").length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

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
                Registered Accounts & Users
              </h1>
              <p className="text-xs text-[#77776F] mt-1">
                View all registered accounts, user roles, creation timestamps, and active members.
              </p>
            </div>

            <span className="text-xs text-[#77776F] self-start md:self-auto">
              Total: <strong className="text-[#171915]">{users.length}</strong> registered accounts
            </span>
          </div>

          {/* 4 Metric KPI Cards matching Events page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Accounts */}
            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#77776F]">Total accounts</div>
                <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                  {totalUsers}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                  <span>↗</span>
                  <span>{regularUsers} attendee profiles</span>
                </div>
              </div>
            </div>

            {/* Card 2: Attendee Community */}
            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
                <User className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#77776F]">Attendees</div>
                <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                  {regularUsers}
                </div>
                <div className="text-[11px] text-[#77776F]">Registered ticket buyers</div>
              </div>
            </div>

            {/* Card 3: Administrators */}
            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#77776F]">Administrators</div>
                <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                  {adminUsers}
                </div>
                <div className="text-[11px] text-[#77776F]">Platform management staff</div>
              </div>
            </div>

            {/* Card 4: Directory Health */}
            <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#77776F]">Directory health</div>
                <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">
                  100%
                </div>
                <div className="text-[11px] text-[#77776F]">All profiles verified</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-3 sm:p-4 shadow-sm flex items-center px-4 py-2.5 bg-[#F7F4ED] gap-3 max-w-md">
            <Search className="w-4 h-4 text-[#77776F]" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#171915] placeholder-[#77776F] focus:outline-none"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px] bg-[#FAF8F5]">
                      <th className="py-3 px-5 font-bold">User</th>
                      <th className="py-3 px-5 font-bold">Email</th>
                      <th className="py-3 px-5 font-bold">Role</th>
                      <th className="py-3 px-5 font-bold">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E2D8]/60">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-[#F7F4ED]/50 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-[#171915] flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#073F2E] text-white flex items-center justify-center text-xs font-bold">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span>{u.name}</span>
                          </td>
                          <td className="py-3.5 px-5 text-[#171915] font-mono text-[11px]">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-[#77776F]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleString() : "Recent"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[#77776F]">
                          No registered accounts matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      </div>
  );
}
