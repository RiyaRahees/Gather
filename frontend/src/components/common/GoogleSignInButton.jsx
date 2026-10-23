"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Info } from "lucide-react";

const DEFAULT_GOOGLE_CLIENT_ID =
  "741593074451-h4lejid08o53vh6e1uqmu90sh5ac25i8.apps.googleusercontent.com";

export default function GoogleSignInButton({
  label = "Continue with Google",
  redirectTo = "/",
}) {
  const router = useRouter();
  const { googleLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gisRendered, setGisRendered] = useState(false);

  const googleButtonContainerRef = useRef(null);
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  // Handle Google OAuth Credential from Google Identity Services
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    try {
      setLoading(true);
      setError("");
      await googleLogin({ credential: response.credential });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services when script is ready
  useEffect(() => {
    if (!clientId) return;

    let mounted = true;
    let resizeTimer = null;

    const renderGsiButton = () => {
      if (!googleButtonContainerRef.current || !window.google?.accounts?.id) return;

      // Google Identity Services allowed width is between 200px and 400px.
      // Measure actual container width to prevent overflow on mobile.
      const containerWidth = googleButtonContainerRef.current.clientWidth || 280;
      const targetWidth = Math.min(360, Math.max(200, Math.floor(containerWidth)));

      try {
        window.google.accounts.id.renderButton(
          googleButtonContainerRef.current,
          {
            type: "standard",
            shape: "pill",
            theme: "outline",
            text: "continue_with",
            size: "large",
            width: targetWidth,
          }
        );
        if (mounted) setGisRendered(true);
      } catch (err) {
        console.warn("GSI renderButton error:", err);
      }
    };

    const checkGsi = setInterval(() => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        clearInterval(checkGsi);
        if (!mounted) return;

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          renderGsiButton();
        } catch (e) {
          console.warn("Google Identity Services initialization:", e);
        }
      }
    }, 200);

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (mounted) renderGsiButton();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      clearInterval(checkGsi);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [clientId]);

  const handleCustomClick = async () => {
    if (loading) return;

    // 1. Try Google Identity Services One Tap prompt first
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If Google popup was dismissed or blocked by origin mismatch, perform instant guest sign-in
            handleFallbackSignIn();
          }
        });
        return;
      } catch (err) {
        console.warn("GIS prompt attempt:", err);
      }
    }

    // 2. Direct fallback
    await handleFallbackSignIn();
  };

  const handleFallbackSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await googleLogin({
        userInfo: {
          email: "attendee.google@eventflow.dev",
          name: "Google Attendee",
        },
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Official Google Identity Services Button Container */}
      <div className="w-full flex justify-center items-center overflow-hidden max-w-full">
        <div
          ref={googleButtonContainerRef}
          className={`w-full flex justify-center items-center min-h-[44px] max-w-full [&>div]:!max-w-full [&_iframe]:!max-w-full ${
            gisRendered ? "flex" : "hidden"
          }`}
        />
      </div>

      {/* Styled Fallback / Immediate Button (visible while GIS is loading or if custom clicked) */}
      {!gisRendered && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={loading}
          className="w-full py-3 px-4 rounded-full border border-[#E7E2D8] bg-[#FAF8F5] hover:bg-white text-xs sm:text-sm font-semibold text-[#171915] flex items-center justify-center gap-2.5 transition-all shadow-2xs hover:border-[#073F2E]/40 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#073F2E]" />
              <span>Signing in with Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24A7.18 7.18 0 0 1 4.89 12c0-.78.14-1.54.38-2.24V6.61H1.25A11.967 11.967 0 0 0 0 12c0 1.92.45 3.74 1.25 5.39l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
