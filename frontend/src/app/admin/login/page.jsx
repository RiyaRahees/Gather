"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/common/Logo";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, adminLogin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear fields on mount to prevent browser autofill
  useEffect(() => {
    setEmail("");
    setPassword("");
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await adminLogin(email.trim(), password);
      // Hard navigation ensures clean session synchronization across entire dashboard
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.message || "Invalid administrator credentials or access denied.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] flex flex-col justify-center items-center px-4 py-4 sm:py-8 font-sans text-[#171915]">
      {/* Centered Brand / Logo */}
      <div className="mb-3 sm:mb-4 flex flex-col items-center">
        <Logo size="sm" variant="dark" href="/" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl border border-[#E7E2D8] p-5 sm:p-7 shadow-[0_4px_24px_rgba(23,25,21,0.04)]">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2] text-[#073F2E] mb-2 shadow-2xs">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#171915]">
            Admin Sign In
          </h1>
          <p className="mt-1 text-xs text-[#77776F]">
            Sign in to access your administrative dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3 sm:space-y-3.5">
          {/* Decoy fields to capture browser autofill */}
          <input
            type="text"
            name="fake_admin_user_autofill"
            tabIndex="-1"
            aria-hidden="true"
            autoComplete="off"
            className="sr-only fixed -top-[9999px] left-0 h-0 w-0 opacity-0 pointer-events-none"
          />
          <input
            type="password"
            name="fake_admin_pwd_autofill"
            tabIndex="-1"
            aria-hidden="true"
            autoComplete="new-password"
            className="sr-only fixed -top-[9999px] left-0 h-0 w-0 opacity-0 pointer-events-none"
          />

          <div>
            <label
              htmlFor="admin-email-field"
              className="block text-xs font-semibold text-[#2E312B] mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email-field"
                name="admin_user_clean_email"
                type="email"
                required
                autoComplete="off"
                data-lpignore="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-field"
              className="block text-xs font-semibold text-[#2E312B] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-field"
                name="admin_user_pass"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F] hover:text-[#171915] transition-colors cursor-pointer p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Back to Site Link */}
      <div className="mt-3.5 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77776F] hover:text-[#073F2E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to website</span>
        </Link>
      </div>
    </div>
  );
}
