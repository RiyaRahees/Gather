"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, ArrowRight, ArrowLeft, Shield, User, LogOut, LogIn, ChevronDown, Ticket, Compass, Calendar, Users, Info } from "lucide-react";

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

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Automatically close mobile drawer when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const userNavLinks = [
    {
      label: "Discover",
      href: "/events",
      icon: Compass,
      isActive: pathname === "/events" && !activeCategory,
    },
    {
      label: "Workshops",
      href: "/events?category=Design",
      icon: Calendar,
      isActive: pathname === "/events" && activeCategory === "Design",
    },
    {
      label: "Conferences",
      href: "/events?category=Technology",
      icon: Users,
      isActive: pathname === "/events" && activeCategory === "Technology",
    },
    {
      label: "About",
      href: "/#about",
      icon: Info,
      isActive: pathname === "/" && typeof window !== "undefined" && window.location.hash === "#about",
    },
  ];

  const adminNavLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: Shield,
      isActive: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      label: "Manage Events",
      href: "/admin/events",
      icon: Calendar,
      isActive: pathname === "/admin/events",
    },
    {
      label: "Attendees",
      href: "/admin/bookings",
      icon: Users,
      isActive: pathname === "/admin/bookings",
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: Ticket,
      isActive: pathname === "/admin/payments",
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: User,
      isActive: pathname === "/admin/users",
    },
  ];

  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminAuthenticated = Boolean(isAdmin && user && user.role === "admin");

  const activeNavLinks = isAdminRoute
    ? (isAdminAuthenticated && !isAdminLoginPage ? adminNavLinks : [])
    : userNavLinks;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2DDD3] shadow-[0_2px_12px_rgba(23,25,21,0.06)] transition-all">
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
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-[#171915] hover:text-[#073F2E] transition-colors focus:outline-hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>

    {/* Dark Semi-Transparent Overlay Covering the Left Screen */}
    <div
      className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ease-in-out md:hidden ${
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setMobileMenuOpen(false)}
      aria-hidden="true"
    />

    {/* Right-Side Mobile Navigation Drawer (covering approx 50-55% mobile screen width) */}
    <aside
      aria-label="Mobile navigation drawer"
      aria-hidden={!mobileMenuOpen}
      className={`fixed top-0 right-0 bottom-0 h-full w-[54%] sm:w-[50%] min-w-[230px] max-w-[340px] bg-[#FCFBF7] border-l border-[#E7E2D8] z-50 shadow-2xl flex flex-col justify-between overflow-y-auto overflow-x-hidden transition-transform duration-300 ease-out md:hidden ${
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Top Header: Gather Logo & Close Button */}
      <div className="relative z-10 px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between border-b border-[#E7E2D8]/40">
        <Link
          href={isAdminRoute && isAdminAuthenticated ? "/admin/dashboard" : "/"}
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center"
        >
          <Logo size="xs" subtitle="CURATED EXPERIENCES" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="p-1.5 -mr-1 text-[#171915] hover:text-[#073F2E] transition-colors rounded-full hover:bg-black/5 cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Middle Navigation Links & Action Group */}
      <div className="relative z-10 px-4 sm:px-5 py-5 flex-1 flex flex-col justify-between">
        <nav className="space-y-4 sm:space-y-5">
          {activeNavLinks.map((item) => {
            const Icon = item.icon || Compass;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 group transition-colors py-0.5 ${
                  item.isActive ? "text-[#073F2E]" : "text-[#171915] hover:text-[#073F2E]"
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                    item.isActive
                      ? "bg-[#073F2E] text-white shadow-xs"
                      : "bg-[#EBF3E8] text-[#073F2E] group-hover:bg-[#DFECE0] group-hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[1.8]" />
                </div>
                <span
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  className={`text-[17px] sm:text-[19px] tracking-tight leading-tight ${
                    item.isActive ? "font-bold text-[#073F2E]" : "font-medium text-[#171915]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions Cluster */}
        <div className="pt-4 border-t border-[#E7E2D8] mt-6 space-y-3.5">
          {/* My Bookings Pill Button */}
          {isAdminRoute && isAdminAuthenticated ? (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-full border border-[#073F2E]/30 bg-white/80 hover:bg-white hover:border-[#073F2E] transition-all group text-[#073F2E] shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#073F2E]" />
                <span
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  className="text-[14px] sm:text-[15px] font-semibold tracking-tight"
                >
                  Admin Dashboard
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#073F2E] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              href={user ? "/account" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-full border border-[#171915]/25 bg-white/80 hover:bg-white hover:border-[#073F2E] transition-all group text-[#171915] shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 text-[#073F2E]" />
                <span
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  className="text-[14px] sm:text-[15px] font-semibold tracking-tight"
                >
                  My Bookings
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#171915] group-hover:text-[#073F2E] group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}

          {/* Logout / Login link */}
          {user ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-2.5 px-1 py-1 text-[#DC2626] hover:text-[#B91C1C] transition-colors cursor-pointer group text-left w-full"
            >
              <LogOut className="w-4 h-4 text-[#DC2626] group-hover:-translate-x-0.5 transition-transform" />
              <span
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                className="text-[15px] sm:text-[16px] font-medium"
              >
                Log out
              </span>
            </button>
          ) : (
            <Link
              href={isAdminRoute ? "/admin/login" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-1 py-1 text-[#073F2E] hover:text-[#052F22] transition-colors group w-full"
            >
              <LogIn className="w-4 h-4 text-[#073F2E] group-hover:translate-x-0.5 transition-transform" />
              <span
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                className="text-[15px] sm:text-[16px] font-medium"
              >
                Log in
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Decorative corner overlapping circles from reference design */}
      <div className="absolute -bottom-8 -right-8 w-44 sm:w-56 h-44 sm:h-56 pointer-events-none select-none z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
          <circle cx="165" cy="165" r="125" fill="#E4EFE7" />
          <circle cx="155" cy="170" r="90" fill="#8EA996" fillOpacity="0.4" />
          <circle cx="170" cy="185" r="70" fill="#073F2E" />
        </svg>
      </div>
    </aside>
  </>
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
