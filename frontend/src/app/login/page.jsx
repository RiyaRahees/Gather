"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import UnifiedAuthCard from "@/components/auth/UnifiedAuthCard";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#073F2E]" />
        </div>
      }
    >
      <UnifiedAuthCard defaultMode="login" />
    </Suspense>
  );
}
