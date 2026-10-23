import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function HostBanner() {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#073F2E] text-white shadow-xl min-h-[320px] sm:min-h-[360px] md:min-h-[420px] flex items-center"
          style={{ position: "relative" }}
        >
          
          {/* Background Photograph with Warm Darkness */}
          <Image
            src="/images/mountain-host.jpg"
            alt="Scenic mountain pavilion hosting space"
            fill
            className="object-cover opacity-35 mix-blend-overlay"
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#073F2E]/95 via-[#073F2E]/75 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-6 sm:p-12 md:p-16 max-w-xl space-y-4 sm:space-y-5">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#A9C3A0] block">
              CURATE & TEACH
            </span>

            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
              Have something
              <br />
              <span className="italic font-normal text-[#A9C3A0]">
                worth sharing?
              </span>
            </h2>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal">
              Whether you host hands-on design clinics, deep technical masterclasses, or intimate creator roundtables, Gather provides the seamless tools to organize and gather your community.
            </p>

            <div className="pt-2">
              <Link
                href="/host"
                className="bg-white text-[#073F2E] hover:bg-[#F7F4ED] px-7 py-3.5 rounded-full text-sm font-semibold tracking-wide inline-flex items-center gap-2 transition-all shadow-md hover:scale-105"
              >
                <span>Host with Gather</span>
                <ArrowRight className="w-4 h-4 text-[#073F2E]" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
