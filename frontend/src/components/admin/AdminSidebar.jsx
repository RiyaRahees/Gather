"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/common/Logo";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  CreditCard,
  UserCheck,
  ExternalLink,
  HelpCircle,
  QrCode,
  X,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function AdminSidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      name: "Manage Events",
      href: "/admin/events",
      icon: Calendar,
      active: pathname === "/admin/events",
    },
    {
      name: "Proposals",
      href: "/admin/proposals",
      icon: Sparkles,
      active: pathname.startsWith("/admin/proposals"),
    },
    {
      name: "Attendees",
      href: "/admin/bookings",
      icon: Users,
      active: pathname === "/admin/bookings",
    },
    {
      name: "Waitlist",
      href: "/admin/waitlist",
      icon: Clock,
      active: pathname === "/admin/waitlist",
    },
    {
      name: "Check-in Scanner",
      href: "/admin/check-in",
      icon: QrCode,
      active: pathname === "/admin/check-in",
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      active: pathname === "/admin/payments",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: UserCheck,
      active: pathname === "/admin/users",
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header matching user side Gather logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#0B3D2D]/60">
          <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Logo size="sm" variant="light" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#7FE5B8] bg-[#0E4935] px-2 py-0.5 rounded-full border border-[#175E46] -mt-1">
              ADMIN
            </span>
          </Link>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-[#8DB4A5] hover:text-white hover:bg-white/10"
            aria-label="Close admin menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="px-3.5 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  item.active
                    ? "bg-[#0E4935] text-white font-semibold shadow-xs"
                    : "text-[#8DB4A5] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? "text-[#7FE5B8]" : "text-[#8DB4A5]"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Live Website Card */}
        <div className="px-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-[#093527]/70 border border-[#114D38] space-y-2">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <span className="text-[#7FE5B8]">❇</span>
              <span>Live Website</span>
              <ExternalLink className="w-3 h-3 text-[#7FE5B8] ml-auto" />
            </div>
            <p className="text-[11px] text-[#8DB4A5] leading-tight">
              Preview public catalogue as an attendee.
            </p>
            <Link
              href="/"
              target="_blank"
              onClick={onClose}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-[#0E4935] hover:bg-[#135942] border border-[#175E46] text-white text-xs font-semibold text-center block transition-all shadow-xs"
            >
              Open Gather ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Footer: Admin Account & Sign Out */}
      <div className="p-3.5 border-t border-[#0B3D2D]/60 space-y-2">
        <div className="p-2.5 rounded-2xl bg-[#093527]/70 border border-[#114D38] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0E4935] text-[#7FE5B8] flex items-center justify-center font-bold text-xs border border-[#175E46] shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || "Administrator"}
                </span>
              </div>
              <p className="text-[10px] text-[#8DB4A5] truncate font-mono">
                {user?.email || "admin@gmail.com"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out of Admin Console"
            className="p-1.5 rounded-xl text-[#8DB4A5] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#8DB4A5]/70">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LIVE • v2.4
          </span>
          <span className="uppercase text-[9px] font-bold text-[#7FE5B8]">SUPER ADMIN</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (lg and above) */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-[#06291E] text-white flex-col justify-between min-h-screen sticky top-0 h-screen overflow-y-auto select-none border-r border-[#0B3D2D]">
        {sidebarContent}
      </aside>

      {/* 2. Mobile / Tablet Drawer & Backdrop (below lg) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Off-canvas Panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] bg-[#06291E] text-white flex flex-col justify-between h-full shadow-2xl overflow-y-auto border-r border-[#0B3D2D] animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
