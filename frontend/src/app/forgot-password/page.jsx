"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import { getApiUrl } from "@/lib/api";
import {
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
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

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: 'request' (enter email) | Step 2: 'reset' (enter OTP & new password) | Step 3: 'success'
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Slide state for left editorial panel
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

  // Step 1: Submit email to receive 6-digit OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to send reset code. Please try again.");
      }

      setOtp("");
      setInfoMessage(`A 6-digit verification code has been sent to ${email.trim()}. Please check your email inbox to enter your code.`);
      setStep("reset");
    } catch (err) {
      setError(err.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setInfoMessage("");
    setResending(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }
      setOtp("");
      setInfoMessage(`A fresh 6-digit verification code has been sent to ${email.trim()}. Please check your email.`);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit OTP & New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      setStep("success");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-y-auto lg:overflow-hidden bg-[#F4F1EA] flex flex-col items-center justify-center p-2 sm:p-4 lg:p-4 font-sans text-[#171915]">
      
      {/* Mobile-Only Header Brand */}
      <div className="lg:hidden mb-3 text-center">
        <Logo size="md" href="/" />
      </div>

      {/* Main Container matching Login */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] bg-[#FAF8F5] rounded-2xl sm:rounded-[30px] shadow-[0_20px_60px_rgba(23,25,21,0.07)] border border-[#E7E2D8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] lg:h-[595px] xl:h-[615px] lg:max-h-[calc(100vh-2rem)]">
        
        {/* LEFT PANEL: Editorial Brand, Slide Title & Curved Arced Photo */}
        <div className="hidden lg:flex lg:col-span-7 p-6 xl:p-8 2xl:p-10 flex-col justify-between relative bg-[#FAF8F5] overflow-hidden h-full">
          
          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Logo size="md" href="/" />
          </div>

          {/* Center Content: Discover / Learn / Connect */}
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

            {/* Subtle dividing line */}
            <div className="w-10 h-0.5 bg-[#8EA996]" />

            <p className="text-xs xl:text-sm text-[#77776F] leading-relaxed max-w-xs xl:max-w-sm">
              {currentSlide.description}
            </p>

            {/* Key Value Items with soft pill icons */}
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

          {/* Bottom Pagination & Navigation Arrows */}
          <div className="relative z-10 flex items-center gap-3 pt-2">
            <span className="text-[11px] xl:text-xs font-mono font-medium text-[#77776F] tracking-wider">
              0{activeSlide + 1} <span className="opacity-40">/</span> 0{SLIDES.length}
            </span>

            {/* Progress line indicator */}
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

          {/* RIGHT-SIDE ORGANIC CURVED PHOTO ARCH */}
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

        {/* RIGHT PANEL: Recovery Card */}
        <div className="lg:col-span-5 p-3 sm:p-5 xl:p-6 flex items-center justify-center bg-[#F4F1EA]/60 border-t lg:border-t-0 lg:border-l border-[#E7E2D8] overflow-y-auto lg:overflow-hidden h-full">
          <div className="w-full max-w-[390px] xl:max-w-md bg-white rounded-2xl sm:rounded-[24px] border border-[#E7E2D8] p-4 sm:p-5 xl:p-6 shadow-[0_12px_36px_rgba(23,25,21,0.06)] min-h-[505px] xl:min-h-[525px] flex flex-col justify-between my-auto">
            
            {/* Top Navigation Tabs */}
            <div className="flex rounded-xl bg-[#FAF8F5] p-1 border border-[#E7E2D8]">
              <Link
                href="/login"
                className="flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center text-[#77776F] hover:text-[#171915]"
              >
                Sign in
              </Link>
              <div className="flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#073F2E] text-white shadow-xs text-center cursor-default">
                Recovery
              </div>
            </div>

            {/* Step 1: Request Reset Code */}
            {step === "request" && (
              <>
                <div className="text-center space-y-0.5">
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#77776F] block">
                    ACCOUNT RECOVERY
                  </span>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#171915] tracking-tight">
                    Forgot password?
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#77776F] leading-tight max-w-xs mx-auto">
                    Enter your email to receive a 6-digit verification code.
                  </p>
                </div>

                {error && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-2.5 sm:space-y-3">
                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <input
                        id="recovery-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 sm:pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
                      />
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
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-0.5 sm:pt-1 text-center text-[11px] sm:text-xs text-[#77776F]">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#073F2E] hover:underline cursor-pointer"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {step === "reset" && (
              <>
                <div className="text-center space-y-0.5">
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#77776F] block">
                    STEP 2 OF 2
                  </span>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#171915] tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#77776F] leading-tight max-w-xs mx-auto">
                    Code sent to <strong className="text-[#171915]">{email}</strong>
                  </p>
                </div>

                {infoMessage && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                    <span>{infoMessage}</span>
                  </div>
                )}

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-2 sm:space-y-2.5">
                  {/* 6-Digit Code */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="otp-code" className="block text-[11px] sm:text-xs font-semibold text-[#2E312B]">
                        6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-[10px] sm:text-[11px] font-semibold text-[#073F2E] hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {resending ? "Resending..." : "Resend code"}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                        <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <input
                        id="otp-code"
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full pl-9 sm:pl-10 pr-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-sm tracking-[0.25em] font-mono text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="new-password" className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1">
                      New Password (min 8 chars)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <input
                        id="new-password"
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
                    <label htmlFor="confirm-password" className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <input
                        id="confirm-password"
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
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-0.5 sm:pt-1 text-center text-[11px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setError("");
                    }}
                    className="text-[#77776F] hover:text-[#171915] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Use a different email</span>
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Success Screen */}
            {step === "success" && (
              <div className="text-center space-y-3.5 py-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="font-sans text-xl font-bold text-[#171915]">
                    Password Updated!
                  </h2>
                  <p className="text-xs text-[#77776F] leading-relaxed max-w-xs mx-auto">
                    Your Gather password has been successfully updated. You can now sign in with your new credentials.
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
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
