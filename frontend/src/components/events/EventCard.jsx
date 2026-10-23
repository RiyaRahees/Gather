"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PriceTag from "@/components/common/PriceTag";
import { ArrowRight, MapPin, Calendar, IndianRupee } from "lucide-react";

export default function EventCard({ event }) {
  const router = useRouter();

  if (!event) return null;

  const eventId = event.slug || event._id || event.id;
  const isFree = event.price === 0;
  const isSoldOut = event.availableSeats === 0;

  const handleCardClick = (e) => {
    // If the click came from interactive elements (like the heart button), don't navigate
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    router.push(`/events/${eventId}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-3xl border border-[#E7E2D8] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#073F2E]/40 hover:-translate-y-1 cursor-pointer"
    >
      
      {/* Event Cover Photo Container */}
      <div
        className="relative aspect-[16/10] overflow-hidden bg-[#F7F4ED]"
        style={{ position: "relative" }}
      >
        <Image
          src={event.image || "/images/event-design-studio.jpg"}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Category Pill Tag */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-white/95 backdrop-blur-sm text-[#073F2E] shadow-sm">
            {event.category}
          </span>
        </div>

        {/* Seat Availability Pill Tag */}
        <div className="absolute top-3.5 right-3.5">
          {isSoldOut ? (
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-sm shadow-sm">
              Sold Out
            </span>
          ) : event.availableSeats <= 5 ? (
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600/90 text-white backdrop-blur-sm shadow-sm">
              Only {event.availableSeats} left
            </span>
          ) : (
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#073F2E]/90 text-white backdrop-blur-sm shadow-sm">
              {event.availableSeats} seats left
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          
          {/* Date & Location Meta (nowrap on date prevents awkward breaking) */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#77776F] min-w-0">
            <span className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-[#55554F]">
              <Calendar className="w-3.5 h-3.5 text-[#073F2E] shrink-0" />
              <span>{event.date}</span>
            </span>
            <span className="text-[#C4BEB2] shrink-0">•</span>
            <span className="inline-flex items-center gap-1 min-w-0 truncate text-[#55554F]">
              <MapPin className="w-3.5 h-3.5 text-[#073F2E] shrink-0" />
              <span className="truncate">{event.venue?.split(",")[0] || event.venue}</span>
            </span>
          </div>

          {/* Event Title */}
          <h3 className="font-serif text-[17px] font-bold text-[#171915] leading-[1.3] line-clamp-2 min-h-[44px] group-hover:text-[#073F2E] transition-colors">
            <Link href={`/events/${eventId}`} className="hover:text-[#073F2E]">
              {event.title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#77776F] line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Organizer */}
          {event.organizerName && (
            <p className="text-[11px] font-medium text-[#77776F] pt-0.5">
              Organized by <span className="text-[#171915] font-semibold">{event.organizerName}</span>
            </p>
          )}
        </div>

        {/* Card Footer: Price with Professional Rupee Icon & Actions */}
        <div className="pt-4 mt-4 border-t border-[#E7E2D8]/70 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] block mb-0.5">
              Admission
            </span>
            {isFree ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-bold text-[#073F2E] font-sans tracking-tight">Free</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EBF3E8] text-[#073F2E]">
                  Access
                </span>
              </div>
            ) : (
              <div className="flex items-center text-[#171915]">
                <IndianRupee className="w-3.5 h-3.5 text-[#073F2E] stroke-[2.5] mr-0.5 shrink-0" />
                <span className="text-[17px] font-bold tracking-tight text-[#171915] font-sans">
                  {typeof event.price === "number" ? event.price.toLocaleString("en-IN") : event.price}
                </span>
              </div>
            )}
          </div>

          {/* Action Row: Book Button */}
          <div className="flex items-center gap-2">
            <Link
              href={`/events/${eventId}`}
              aria-label={`View details for ${event.title}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#073F2E] hover:bg-[#052F22] text-white text-[12px] font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow active:scale-95 group/btn"
            >
              <span>{isFree ? "Register" : "Book"}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

    </article>
  );
}
