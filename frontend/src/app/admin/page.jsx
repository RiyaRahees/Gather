"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5]">
      <Loader2 className="w-7 h-7 animate-spin text-[#073F2E]" />
    </div>
  );
}
