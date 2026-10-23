"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/common/Logo";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Calendar,
  Compass,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
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

export default function UnifiedAuthCard({ defaultMode = "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  // Mode: "login" or "register"
  const urlMode = searchParams.get("mode");
  const [authMode, setAuthMode] = useState(urlMode || defaultMode);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Slide state for desktop left banner
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = SLIDES[activeSlide];

  // Force fields to stay empty on initial render, ignoring unwanted browser autofill
  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 120);
    return () => clearTimeout(timer);
  }, [authMode]);

  useEffect(() => {
    if (urlMode === "register" || urlMode === "login") {
      setAuthMode(urlMode);
    }
  }, [urlMode]);

  const switchMode = (mode) => {
    setAuthMode(mode);
    setEmail("");
    setPassword("");
    setError("");
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail === "admin@gmail.com") {
      setError(
        "Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login."
      );
      return;
    }

    if (authMode === "register") {
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters long.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      if (authMode === "register") {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // Always redirect to home page "/" unless an explicit non-account destination was requested
      const explicitRedirect = searchParams.get("redirect");
      const targetUrl =
        explicitRedirect &&
        !explicitRedirect.startsWith("/account") &&
        !explicitRedirect.startsWith("/admin")
          ? explicitRedirect
          : "/";

      router.push(targetUrl);
      router.refresh();
    } catch (err) {
      setError(err.message || (authMode === "register" ? "Failed to create account." : "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = authMode === "login";

  return (
    <div className="h-screen max-h-screen overflow-y-auto lg:overflow-hidden bg-[#F4F1EA] flex flex-col items-center justify-center p-2 sm:p-4 lg:p-4 font-sans text-[#171915]">
      
      {/* Mobile-Only Header Brand */}
      <div className="lg:hidden mb-3 text-center">
        <Logo size="md" href="/" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] bg-[#FAF8F5] rounded-2xl sm:rounded-[30px] shadow-[0_20px_60px_rgba(23,25,21,0.07)] border border-[#E7E2D8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] lg:h-[595px] xl:h-[615px] lg:max-h-[calc(100vh-2rem)]">
        
        {/* LEFT PANEL: Editorial Brand, Slide Title & Curved Arced Photo (Hidden on mobile, luxurious on desktop) */}
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

        {/* RIGHT PANEL: Single Unified Form Card */}
        <div className="lg:col-span-5 p-3 sm:p-5 xl:p-6 flex items-center justify-center bg-[#F4F1EA]/60 border-t lg:border-t-0 lg:border-l border-[#E7E2D8] overflow-y-auto lg:overflow-hidden h-full">
          <div className="w-full max-w-[390px] xl:max-w-md bg-white rounded-2xl sm:rounded-[24px] border border-[#E7E2D8] p-4 sm:p-5 xl:p-6 shadow-[0_12px_36px_rgba(23,25,21,0.06)] min-h-[505px] xl:min-h-[525px] flex flex-col justify-between my-auto">
            
            {/* Unified Mode Toggle Tabs */}
            <div className="flex rounded-xl bg-[#FAF8F5] p-1 border border-[#E7E2D8]">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isLogin
                    ? "bg-[#073F2E] text-white shadow-xs"
                    : "text-[#77776F] hover:text-[#171915]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  !isLogin
                    ? "bg-[#073F2E] text-white shadow-xs"
                    : "text-[#77776F] hover:text-[#171915]"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Form Title & Subtitle */}
            <div className="space-y-2.5 sm:space-y-3 my-auto py-1">
              <div className="text-center space-y-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-[#77776F] block">
                  {isLogin ? "WELCOME BACK" : "JOIN GATHER"}
                </span>
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#171915] tracking-tight">
                  {isLogin ? "Sign in to Gather" : "Create your account"}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#77776F] leading-tight max-w-xs mx-auto">
                  {isLogin
                    ? "Access your account to manage bookings, attend events and more."
                    : "Sign up to reserve workshop passes and access curated sessions."}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{error}</span>
                    {(error.includes("/admin/login") || error.includes("Administrator")) && (
                      <div className="pt-1">
                        <Link
                          href="/admin/login"
                          className="inline-flex items-center gap-1 font-bold text-[#073F2E] underline hover:text-[#052F22]"
                        >
                          <span>Open Admin Portal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Interactive Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-2.5 sm:space-y-3">
              {/* Hidden dummy fields to capture aggressive browser autofill */}
              <input
                type="text"
                name="fake_user_name_autofill"
                tabIndex="-1"
                aria-hidden="true"
                autoComplete="off"
                className="sr-only fixed -top-[9999px] left-0 h-0 w-0 opacity-0 pointer-events-none"
              />
              <input
                type="password"
                name="fake_user_password_autofill"
                tabIndex="-1"
                aria-hidden="true"
                autoComplete="new-password"
                className="sr-only fixed -top-[9999px] left-0 h-0 w-0 opacity-0 pointer-events-none"
              />

              {/* Full Name field (Only in Register mode) */}
              {!isLogin && (
                <div className="animate-in fade-in duration-200">
                  <label
                    htmlFor="auth-name"
                    className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <input
                      id="auth-name"
                      name="gather_user_fullname"
                      type="text"
                      required={!isLogin}
                      autoComplete="off"
                      data-lpignore="true"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full pl-9 sm:pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* Email Input with Mail Icon */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[11px] sm:text-xs font-semibold text-[#2E312B] mb-1"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    id="auth-email"
                    name="gather_user_email_clean"
                    type="email"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 sm:pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input with Lock Icon & Eye Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className="block text-[11px] sm:text-xs font-semibold text-[#2E312B]"
                  >
                    Password
                  </label>
                  {isLogin && (
                    <Link
                      href="/forgot-password"
                      className="text-[11px] sm:text-xs font-semibold text-[#073F2E] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77776F] pointer-events-none">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    id="auth-password"
                    name="gather_user_pass_clean"
                    key={showPassword ? "text" : "password"}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
                    className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2D8] text-xs sm:text-sm text-[#171915] placeholder-[#77776F]/60 focus:outline-none focus:border-[#073F2E] focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77776F] hover:text-[#171915] p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-[10px] sm:text-[11px] text-[#77776F] mt-1 pl-1">
                    Must be at least 8 characters long
                  </p>
                )}
              </div>

                {/* Submit Pill Button */}
                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={loading}
                  className="w-full mt-1 py-2.5 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? "Sign in" : "Create account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider OR */}
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-[#E7E2D8] w-full" />
                <span className="bg-white px-2.5 text-[9px] sm:text-[10px] font-bold text-[#77776F] uppercase tracking-wider relative">
                  OR
                </span>
              </div>

            {/* Continue with Google Button */}
            <GoogleSignInButton
              label={isLogin ? "Continue with Google" : "Sign up with Google"}
              redirectTo={searchParams?.get("redirect") || "/"}
            />

            {/* Footer Bottom Switch */}
            <div className="pt-1 text-center text-[11px] sm:text-xs text-[#77776F]">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-bold text-[#073F2E] hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-bold text-[#073F2E] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
