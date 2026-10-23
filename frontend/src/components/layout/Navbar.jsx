"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, ArrowRight, ArrowLeft, Shield, User, LogOut, ChevronDown, Ticket } from "lucide-react";

import { usePathname, useSearchParams } from "next/navigation";
import Logo from "@/components/common/Logo";

function NavbarContent() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const isAdminRoute = pathname?.startsWith("/admin");

  // Handle click outside to smoothly dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const userNavLinks = [
    {
      label: "Discover",
      href: "/events",
      isActive: pathname === "/events" && !activeCategory,
    },
    {
      label: "Workshops",
      href: "/events?category=Design",
      isActive: pathname === "/events" && activeCategory === "Design",
    },
    {
      label: "Conferences",
      href: "/events?category=Technology",
      isActive: pathname === "/events" && activeCategory === "Technology",
    },
    {
      label: "About",
      href: "/#about",
      isActive: pathname === "/" && typeof window !== "undefined" && window.location.hash === "#about",
    },
  ];

  const adminNavLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      isActive: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      label: "Manage Events",
      href: "/admin/events",
      isActive: pathname === "/admin/events",
    },
    {
      label: "Attendees",
      href: "/admin/bookings",
      isActive: pathname === "/admin/bookings",
    },
    {
      label: "Payments",
      href: "/admin/payments",
      isActive: pathname === "/admin/payments",
    },
    {
      label: "Users",
      href: "/admin/users",
      isActive: pathname === "/admin/users",
    },
  ];

  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminAuthenticated = Boolean(isAdmin && user && user.role === "admin");

  const activeNavLinks = isAdminRoute
    ? (isAdminAuthenticated && !isAdminLoginPage ? adminNavLinks : [])
    : userNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E2DDD3] shadow-[0_2px_12px_rgba(23,25,21,0.06)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        
        {/* Clean Standard Brand Name */}
        <Link href={isAdminRoute && isAdminAuthenticated ? "/admin/dashboard" : "/"} className="flex items-center gap-2 group">
          <Logo size="md" />
          {isAdminRoute && (
            <span className="bg-[#073F2E] text-[#A9C3A0] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs self-center">
              Admin
            </span>
          )}
        </Link>

        {/* Desktop Navigation Links - only show when there are valid links */}
        {activeNavLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 bg-[#F4F1EA] p-1.5 rounded-full border border-[#DFD9CD] text-[13px] font-medium text-[#55554F] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            {activeNavLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-1.5 rounded-full transition-all duration-200 ${
                  item.isActive
                    ? "bg-white text-[#073F2E] font-semibold shadow-xs"
                    : "hover:text-[#073F2E] hover:bg-white/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Action Cluster */}
        <div className="hidden md:flex items-center gap-4">
          {isAdminLoginPage ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#55554F] hover:text-[#073F2E] px-4 py-2 rounded-full border border-[#DFD9CD] hover:border-[#073F2E] transition-all bg-[#FAF8F5]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Gather</span>
            </Link>
          ) : (
            <>
              {/* Attendee / Admin Menu cluster */}
              {((!isAdminRoute && user && user.role !== "admin" && user.email !== "admin@gmail.com") || (isAdminRoute && user && user.role === "admin")) ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Luxury Profile Trigger */}
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                      userDropdownOpen
                        ? "bg-[#F7F4ED] border-[#073F2E] shadow-xs"
                        : "bg-white border-[#E7E2D8] hover:border-[#073F2E]/40 hover:bg-[#FAF8F5] shadow-2xs"
                    }`}
                    aria-label="Toggle account menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#073F2E] to-[#0D5C44] text-[#EBF3E8] flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-white">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#171915] tracking-tight">
                      {user.name?.split(" ")[0] || "Account"}
                    </span>
                    {isAdminRoute && (
                      <span className="bg-[#073F2E] text-[#A9C3A0] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#77776F] group-hover:text-[#073F2E] transition-transform duration-200 ${
                        userDropdownOpen ? "rotate-180 text-[#073F2E]" : ""
                      }`}
                    />
                  </button>

                  {/* Refined Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-68 bg-white/98 backdrop-blur-xl border border-[#E7E2D8] rounded-2xl shadow-[0_14px_40px_rgba(7,63,46,0.12),0_4px_12px_rgba(0,0,0,0.04)] p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Profile Header Card */}
                      <div className="px-3.5 py-3 bg-[#FAF8F5] rounded-xl border border-[#EFECE6] mb-1">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#073F2E] to-[#0D5C44] text-[#EBF3E8] flex items-center justify-center text-sm font-bold shadow-xs ring-2 ring-white">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#171915] truncate">
                              {user.name || "Attendee"}
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-[#073F2E] bg-[#EAF5EE] border border-[#C5E4D1] px-1.5 py-0.2 rounded-md">
                              {isAdminRoute ? "Administrator" : "Verified Member"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#77776F] truncate font-mono mt-1">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Actions */}
                      <div className="space-y-0.5">
                        {!isAdminRoute ? (
                          <Link
                            href="/account"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#171915] hover:bg-[#F7F4ED] hover:text-[#073F2E] transition-all group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E7E2D8] group-hover:bg-white group-hover:border-[#073F2E]/30 flex items-center justify-center text-[#073F2E] transition-colors">
                                <Ticket className="w-3.5 h-3.5" />
                              </div>
                              <span>My Bookings &amp; Passes</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#B0AAA0] group-hover:text-[#073F2E] group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        ) : (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#073F2E] bg-[#EAF5EE]/60 hover:bg-[#EAF5EE] transition-all group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white border border-[#C5E4D1] flex items-center justify-center text-[#073F2E]">
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              <span>Admin Dashboard</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#073F2E] group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        )}

                        <div className="border-t border-[#F0ECE1] my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FFF1F2] transition-colors text-left group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#FFF5F5] group-hover:bg-white border border-[#FECDD3] flex items-center justify-center text-[#DC2626] transition-colors">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href={isAdminRoute ? "/admin/login" : "/login"}
                    className="text-[14px] font-semibold text-[#171915] hover:text-[#073F2E] transition-colors"
                  >
                    Log in
                  </Link>
                  {!isAdminRoute && (
                    <Link
                      href="/events"
                      className="btn-forest px-5 py-2.5 rounded-full text-[13px] font-semibold tracking-wide flex items-center gap-1.5"
                    >
                      <span>Explore Events</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Action Button */}
        {isAdminLoginPage ? (
          <div className="md:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#55554F] px-3 py-1.5 rounded-full border border-[#DFD9CD] bg-[#FAF8F5]"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </Link>
          </div>
        ) : (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#171915]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Right-Aligned Mobile Side Drawer with Dimmed Background Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Dimmed Background Overlay (Click outside to close) */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Right Slide-In Drawer */}
          <aside
            className="fixed top-0 right-0 bottom-0 w-[68%] sm:w-[280px] max-w-[80vw] bg-white border-l border-[#E2DDD3] z-50 shadow-2xl flex flex-col justify-between p-5 md:hidden animate-in slide-in-from-right duration-300"
            aria-label="Mobile Navigation"
          >
            <div>
              {/* Drawer Header: Logo + Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3] mb-4">
                <Logo size="sm" href="/" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-[#171915] hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {activeNavLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      item.isActive
                        ? "bg-[#073F2E] text-white"
                        : "text-[#171915] hover:bg-[#E7E2D8]/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom Actions Cluster */}
            <div className="pt-4 border-t border-[#E7E2D8] flex flex-col gap-2.5">
              {((!isAdminRoute && user && user.role !== "admin" && user.email !== "admin@gmail.com") || (isAdminRoute && user && user.role === "admin")) ? (
                <>
                  {!isAdminRoute ? (
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-full text-center text-xs sm:text-sm font-semibold border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-white text-[#171915] shadow-2xs"
                    >
                      My Bookings
                    </Link>
                  ) : (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-full text-center text-xs sm:text-sm font-semibold bg-[#073F2E] text-white shadow-xs"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2 text-center text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={isAdminRoute ? "/admin/login" : "/login"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-full text-center text-xs sm:text-sm font-semibold border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-white text-[#171915] shadow-2xs"
                  >
                    Log in
                  </Link>
                  {!isAdminRoute && (
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-full text-center text-xs sm:text-sm font-semibold bg-[#073F2E] text-white shadow-xs"
                    >
                      Sign Up
                    </Link>
                  )}
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E2DDD3] shadow-[0_2px_12px_rgba(23,25,21,0.06)] h-20" />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
