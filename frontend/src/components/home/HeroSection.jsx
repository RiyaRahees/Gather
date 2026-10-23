"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";

export default function HeroSection({ featuredEvent }) {
  const eventTitle = featuredEvent?.title || "Design Beyond the Screen";
  const eventDate = featuredEvent?.date || "This Month";
  const eventVenue = featuredEvent?.venue?.split(",")[0] || "Curated Workshop";
  const eventHref = featuredEvent ? `/events/${featuredEvent.slug || featuredEvent._id}` : "/events";

  return (
    <section className="relative pt-8 pb-12 md:pt-14 md:pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-7 pr-0 lg:pr-4">
            
            {/* Eyebrow */}
            <div className="inline-block">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F]">
                GOOD THINGS HAPPEN WHEN WE GATHER
              </span>
            </div>

            {/* Headline with exact serif italic styling matching Gatherly reference */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-[70px] font-medium tracking-tight text-[#171915] leading-[1.06] sm:leading-[1.04]">
              Learn. Connect.
              <br />
              <span className="italic font-normal text-[#073F2E]">
                Create what&apos;s next.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-[15px] sm:text-[16px] md:text-[17px] text-[#77776F] leading-relaxed max-w-lg font-normal">
              Discover meaningful events, inspiring workshops, and a community of people who love to learn, build, and grow together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/events"
                className="btn-forest px-6 py-3.5 rounded-full text-[14px] font-semibold tracking-wide inline-flex items-center gap-2"
              >
                <span>Explore upcoming events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/host"
                className="btn-secondary px-6 py-3.5 rounded-full text-[14px] font-semibold"
              >
                Host an event
              </Link>
            </div>

            {/* Community Social Proof */}
            <div className="pt-4 flex items-center gap-3.5">
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-[#073F2E] text-[#A9C3A0] border-2 border-[#F7F4ED] flex items-center justify-center text-xs font-bold">
                  AR
                </div>
                <div className="w-9 h-9 rounded-full bg-[#426B56] text-white border-2 border-[#F7F4ED] flex items-center justify-center text-xs font-bold">
                  MK
                </div>
                <div className="w-9 h-9 rounded-full bg-[#A9C3A0] text-[#073F2E] border-2 border-[#F7F4ED] flex items-center justify-center text-xs font-bold">
                  SL
                </div>
                <div className="w-9 h-9 rounded-full bg-[#171915] text-white border-2 border-[#F7F4ED] flex items-center justify-center text-xs font-bold">
                  +
                </div>
              </div>
              <p className="text-xs font-medium text-[#77776F]">
                Joined by <strong className="text-[#171915]">1,200+</strong> practitioners and creators
              </p>
            </div>
          </div>

          {/* Right Column: Asymmetrical Photo Collage matching Gatherly */}
          <div className="lg:col-span-6 relative">
            <div className="grid grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
              
              {/* Primary Large Event Photograph */}
              <div
                className="col-span-8 relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg group"
                style={{ position: "relative" }}
              >
                <Image
                  src="/images/hero-main.jpg"
                  alt="Workshop participants collaborating in natural lighting"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                {/* Editorial Tag Overlay */}
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white tracking-wide">
                  Masterclass Studio
                </div>

                {/* White Featured Event Overlay Card */}
                <Link
                  href={eventHref}
                  aria-label={`View featured event: ${eventTitle}`}
                  className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 bg-white/95 backdrop-blur-md border border-[#E7E2D8] hover:border-[#073F2E]/40 hover:bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-md flex items-center justify-between gap-2 sm:gap-3 group/card transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-[#073F2E] block mb-0.5">
                      FEATURED THIS MONTH
                    </span>
                    <h3 className="font-serif text-xs sm:text-base font-bold text-[#171915] truncate group-hover/card:text-[#073F2E] transition-colors">
                      {eventTitle}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#77776F] mt-0.5 sm:mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#073F2E]" />
                        <span>{eventDate}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#073F2E]" />
                        <span>{eventVenue}</span>
                      </span>
                    </div>
                  </div>
                  <div
                    className="circle-arrow-btn flex-shrink-0 group-hover/card:scale-105 transition-transform"
                  >
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </Link>
              </div>

              {/* Smaller Stacked Images on Right */}
              <div className="col-span-4 flex flex-col gap-3.5 sm:gap-4">
                
                {/* Top Secondary Image */}
                <div
                  className="relative rounded-2xl overflow-hidden aspect-square shadow-md group"
                  style={{ position: "relative" }}
                >
                  <Image
                    src="/images/hero-side-top.jpg"
                    alt="Creative team examining physical prototypes"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full inline-block">
                      Creative Direction
                    </span>
                  </div>
                </div>

                {/* Bottom Secondary Image */}
                <div
                  className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group"
                  style={{ position: "relative" }}
                >
                  <Image
                    src="/images/hero-side-bottom.jpg"
                    alt="Speaker sharing insights with an intimate audience"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full inline-block">
                      Keynote Series
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
