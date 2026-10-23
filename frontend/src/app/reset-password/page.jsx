"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/common/Logo";
import { getApiUrl } from "@/lib/api";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  Compass,
} from "lucide-react";

const SLIDES = [
  {
    title: ["Discover", "Learn", "Connect"],
    description: "Join workshops, conferences and community events that inspire growth.",
    image: "/images/auth-login.jpg",
    items: [
      { icon: Users, label: "Curated Experiences" },
      { icon: Calendar, label: "Expert Workshops" },
      { icon: Compass, label: "A Like-Minded Community" },
    ],
  },
  {
    title: ["Innovate", "Create", "Grow"],
    description: "Hands-on masterclasses designed by top practitioners across tech and design.",
    image: "/images/auth-register.jpg",
    items: [
      { icon: Users, label: "Intimate Cohorts" },
      { icon: Calendar, label: "Actionable Frameworks" },
      { icon: Compass, label: "Global Practitioner Network" },
    ],
  },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid reset token. Please request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: emailParam,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-3.5 py-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-sans text-xl font-bold text-[#171915]">
            Password Updated!
          </h2>
          <p className="text-xs text-[#77776F] leading-relaxed max-w-xs mx-auto">
            Your password has been successfully reset. You can now log in to your Gather account.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="w-full py-2.5 sm:py-3 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow active:scale-[0.99]"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center space-y-0.5">
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#77776F] block">
          NEW CREDENTIALS
        </span>
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#171915] tracking-tight">
          Create new password
        </h2>
        <p className="text-[11px] sm:text-xs text-[#77776F] leading-tight max-w-xs mx-auto">
          {emailParam ? `Resetting password for ${emailParam}` : "Please enter your new password."}
        </p>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-2 sm:space-y-2.5">
        {/* New Password */}
        <div>
          <label htmlFor="direct-new-password" className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1">
            New Password (min 8 chars)
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              id="direct-new-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full pl-9 sm:pl-10 pr-10 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F] hover:text-[#171915] p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="direct-confirm-password" className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              id="direct-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full pl-9 sm:pl-10 pr-10 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F] hover:text-[#171915] p-1 cursor-pointer"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 sm:mt-1.5 py-2.5 sm:py-2.5 xl:py-3 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Save New Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-0.5 sm:pt-1 text-center text-[11px] sm:text-xs">
        <Link
          href="/login"
          className="text-[#77776F] hover:text-[#171915] inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign in</span>
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = SLIDES[activeSlide];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className="h-screen max-h-screen overflow-y-auto lg:overflow-hidden bg-[#F4F1EA] flex flex-col items-center justify-center p-2 sm:p-4 lg:p-4 font-sans text-[#171915]">
      
      {/* Mobile-Only Header Brand */}
      <div className="lg:hidden mb-3 text-center">
        <Logo size="md" href="/" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] bg-[#FAF8F5] rounded-2xl sm:rounded-[30px] shadow-[0_20px_60px_rgba(23,25,21,0.07)] border border-[#E7E2D8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] lg:h-[595px] xl:h-[615px] lg:max-h-[calc(100vh-2rem)]">
        
        {/* LEFT PANEL: Editorial Brand, Slide Title & Curved Arced Photo */}
        <div className="hidden lg:flex lg:col-span-7 p-6 xl:p-8 2xl:p-10 flex-col justify-between relative bg-[#FAF8F5] overflow-hidden h-full">
          
          <div className="relative z-10">
            <Logo size="md" href="/" />
          </div>

          <div
            key={activeSlide}
            className="relative z-10 max-w-sm xl:max-w-md my-auto py-2 space-y-3 xl:space-y-4 animate-in fade-in duration-500"
          >
            <h1 className="font-serif text-3xl xl:text-4xl 2xl:text-[44px] font-bold text-[#171915] leading-[1.08] tracking-tight">
              {currentSlide.title.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <div className="w-10 h-0.5 bg-[#8EA996]" />

            <p className="text-xs xl:text-sm text-[#77776F] leading-relaxed max-w-xs xl:max-w-sm">
              {currentSlide.description}
            </p>

            <div className="space-y-2 xl:space-y-3 pt-1">
              {currentSlide.items.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#EBF3E8] border border-[#D5E3D2] flex items-center justify-center text-[#073F2E] flex-shrink-0">
                      <IconComponent className="w-3.5 h-3.5 xl:w-4 xl:h-4 stroke-[2]" />
                    </div>
                    <span className="text-xs xl:text-sm font-medium text-[#2E312B]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 pt-2">
            <span className="text-[11px] xl:text-xs font-mono font-medium text-[#77776F] tracking-wider">
              0{activeSlide + 1} <span className="opacity-40">/</span> 0{SLIDES.length}
            </span>

            <div className="w-16 xl:w-20 bg-[#E7E2D8] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#073F2E] h-full transition-all duration-500 ease-out"
                style={{ width: `${((activeSlide + 1) / SLIDES.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="w-8 h-8 rounded-full bg-[#EBF3E8] hover:bg-[#DCEADA] text-[#073F2E] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="w-9 h-9 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-20 top-0 bottom-0 w-[350px] xl:w-[400px] pointer-events-none z-0">
            <div className="absolute inset-0 bg-[#8EA996]/35 rounded-l-[180px] transform -translate-x-3 scale-y-105" />
            <div className="absolute bottom-6 -left-6 w-36 h-36 xl:w-40 xl:h-40 rounded-full bg-[#073F2E] opacity-90 z-20" />
            <div className="relative w-full h-full rounded-l-[170px] overflow-hidden border-l-4 border-white shadow-2xl z-10">
              {SLIDES.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt="Event workshop crowd"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="lg:col-span-5 p-3 sm:p-5 xl:p-6 flex items-center justify-center bg-[#F4F1EA]/60 border-t lg:border-t-0 lg:border-l border-[#E7E2D8] overflow-y-auto lg:overflow-hidden h-full">
          <div className="w-full max-w-[390px] xl:max-w-md bg-white rounded-2xl sm:rounded-[24px] border border-[#E7E2D8] p-4 sm:p-5 xl:p-6 shadow-[0_12px_36px_rgba(23,25,21,0.06)] min-h-[505px] xl:min-h-[525px] flex flex-col justify-between my-auto">
            
            <div className="flex rounded-xl bg-[#FAF8F5] p-1 border border-[#E7E2D8]">
              <Link
                href="/login"
                className="flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center text-[#77776F] hover:text-[#171915]"
              >
                Sign in
              </Link>
              <div className="flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#073F2E] text-white shadow-xs text-center cursor-default">
                New Password
              </div>
            </div>

            <Suspense fallback={<div className="py-8 text-center text-xs text-[#77776F]">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>

          </div>
        </div>

      </div>
    </div>
  );
}
