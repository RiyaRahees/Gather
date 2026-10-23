"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/common/Logo";
import { Loader2, Menu } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const isLoginPage = pathname === "/admin/login";

  // Redirect unauthenticated visitors to /admin/login (when not already on login page)
  useEffect(() => {
    if (!isLoginPage && !loading && (!user || !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, loading, user, isAdmin, router]);

  // Login page renders independently without sidebar/guard wrap
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Fast loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF9F5] text-[#171915]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#77776F]">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  // If unauthorized, show lightweight redirect indicator
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF9F5] text-[#171915]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
          <p className="text-xs text-[#77776F]">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  // Authenticated as Admin: render Sidebar + Admin Content
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5] text-[#171915]">
      {/* Sleek Vertical Sidebar Navigation */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Administrative Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar (< lg) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#06291E] border-b border-[#0B3D2D] text-white">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl text-[#8DB4A5] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo size="sm" variant="light" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#7FE5B8] bg-[#0E4935] px-2 py-0.5 rounded-full border border-[#175E46]">
              ADMIN
            </span>
          </Link>

          <div className="w-8 h-8 rounded-full bg-[#0E4935] text-[#7FE5B8] flex items-center justify-center font-bold text-xs border border-[#175E46]">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
